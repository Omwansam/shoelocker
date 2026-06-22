"""Gemini vision helper for admin product catalog suggestions."""

import base64
import io
import json
import os
import re

import requests
from flask import current_app

GEMINI_API_BASE = 'https://generativelanguage.googleapis.com/v1beta/models'

# Models that often have limit:0 on AI Studio keys — skip these
DEPRECATED_OR_BLOCKED_MODELS = frozenset({
    'gemini-2.0-flash',
    'gemini-1.5-flash',
    'gemini-1.5-flash-8b',
    'gemini-1.5-pro',
})

# Current free-tier vision models (June 2026)
FREE_TIER_MODELS = (
    'gemini-2.5-flash',
    'gemini-2.5-flash-lite',
    'gemini-2.0-flash-lite',
)

SYSTEM_PROMPT = """You are a catalog assistant for Shoe Locker Kenya, an athletic footwear and apparel retailer.
Analyze the product photo and return ONLY valid JSON (no markdown) with this exact schema:
{
  "product_name": "string",
  "brand": "string",
  "product_description": "string (2-4 sentences, Kenyan retail tone, mention use case)",
  "storefront_category": "men|women|kids",
  "product_type": "shoes|apparel|accessories",
  "sizes": ["array of size strings"],
  "id_slug": "lowercase-hyphenated-url-handle"
}
Rules:
- Do NOT invent a price.
- storefront_category must be one of: men, women, kids.
- product_type must be one of: shoes, apparel, accessories.
- For shoes use Kenyan/US men's sizing numbers when possible (7-12).
- For apparel use S, M, L, XL, XXL.
- For accessories use "One Size" when appropriate.
- id_slug should be derived from product_name (lowercase, hyphens, no special chars).
- If gender is uncertain, pick the most likely and keep description neutral.
"""


class GeminiApiError(Exception):
    def __init__(self, message, status_code=500, quota_exceeded=False):
        super().__init__(message)
        self.status_code = status_code
        self.quota_exceeded = quota_exceeded


def _slugify(text):
    slug = re.sub(r'[^a-z0-9]+', '-', (text or '').lower()).strip('-')
    return slug[:120] or 'new-product'


def _normalize_suggestions(raw):
    """Validate and normalize model output."""
    category = str(raw.get('storefront_category', 'men')).lower()
    if category not in ('men', 'women', 'kids'):
        category = 'men'

    product_type = str(raw.get('product_type', 'shoes')).lower()
    if product_type not in ('shoes', 'apparel', 'accessories'):
        product_type = 'shoes'

    sizes = raw.get('sizes') or []
    if not isinstance(sizes, list):
        sizes = []
    sizes = [str(s).strip() for s in sizes if str(s).strip()]

    if not sizes:
        if product_type == 'apparel':
            sizes = ['S', 'M', 'L', 'XL', 'XXL']
        elif product_type == 'accessories':
            sizes = ['One Size']
        else:
            sizes = ['8', '9', '10', '11', '12']

    name = str(raw.get('product_name', '')).strip() or 'New Product'
    brand = str(raw.get('brand', '')).strip() or 'Unknown'
    description = str(raw.get('product_description', '')).strip() or name
    id_slug = str(raw.get('id_slug', '')).strip() or _slugify(name)

    return {
        'product_name': name[:150],
        'brand': brand[:100],
        'product_description': description[:2000],
        'storefront_category': category,
        'product_type': product_type,
        'sizes': sizes[:20],
        'id_slug': _slugify(id_slug),
    }


def _extract_json(text):
    text = (text or '').strip()
    if text.startswith('```'):
        text = re.sub(r'^```(?:json)?\s*', '', text)
        text = re.sub(r'\s*```$', '', text)
    match = re.search(r'\{[\s\S]*\}', text)
    if match and not text.startswith('{'):
        text = match.group(0)
    return json.loads(text)


def _optimize_image(image_bytes, mime_type):
    """Shrink large photos to reduce Gemini token usage (free tier)."""
    try:
        from PIL import Image
    except ImportError:
        return image_bytes, mime_type

    try:
        img = Image.open(io.BytesIO(image_bytes))
        img = img.convert('RGB')
        max_side = 1024
        w, h = img.size
        if max(w, h) > max_side:
            scale = max_side / max(w, h)
            img = img.resize((int(w * scale), int(h * scale)), Image.Resampling.LANCZOS)

        out = io.BytesIO()
        img.save(out, format='JPEG', quality=82, optimize=True)
        return out.getvalue(), 'image/jpeg'
    except Exception as e:
        current_app.logger.warning(f'Image optimize skipped: {e}')
        return image_bytes, mime_type


def _models_to_try():
    configured = (
        current_app.config.get('GEMINI_MODEL')
        or os.getenv('GEMINI_MODEL')
        or ''
    ).strip()

    models = []
    for candidate in (configured, *FREE_TIER_MODELS):
        if not candidate or candidate in DEPRECATED_OR_BLOCKED_MODELS:
            continue
        if candidate not in models:
            models.append(candidate)

    if not models:
        models = list(FREE_TIER_MODELS)
    return models


def _call_gemini_model(model, api_key, image_bytes, mime_type, hint=''):
    url = f'{GEMINI_API_BASE}/{model}:generateContent?key={api_key}'

    user_text = SYSTEM_PROMPT
    if hint:
        user_text += f'\nAdditional context from staff: {hint}'

    payload = {
        'contents': [
            {
                'parts': [
                    {'text': user_text},
                    {
                        'inline_data': {
                            'mime_type': mime_type or 'image/jpeg',
                            'data': base64.b64encode(image_bytes).decode('utf-8'),
                        }
                    },
                ]
            }
        ],
        'generationConfig': {
            'temperature': 0.4,
            'responseMimeType': 'application/json',
        },
    }

    response = requests.post(url, json=payload, timeout=90)
    if response.status_code == 429:
        raise GeminiApiError(
            f'Quota exceeded for {model}',
            status_code=429,
            quota_exceeded=True,
        )
    if response.status_code == 404:
        raise GeminiApiError(
            f'Model {model} is not available for this API key',
            status_code=404,
        )
    if not response.ok:
        detail = response.text[:400]
        raise GeminiApiError(f'Gemini error ({response.status_code}): {detail}', status_code=response.status_code)

    data = response.json()
    candidates = data.get('candidates') or []
    if not candidates:
        raise GeminiApiError('Gemini returned no candidates')

    parts = candidates[0].get('content', {}).get('parts') or []
    text_parts = [p.get('text', '') for p in parts if p.get('text')]
    if not text_parts:
        raise GeminiApiError('Gemini returned empty text')

    raw = _extract_json(''.join(text_parts))
    return _normalize_suggestions(raw)


def suggest_product_via_gemini(image_bytes, mime_type='image/jpeg', hint='', skip_optimize=False):
    api_key = current_app.config.get('GEMINI_API_KEY') or os.getenv('GEMINI_API_KEY')
    if not api_key:
        raise ValueError('GEMINI_API_KEY is not configured. Add it to BACKEND/server/.env')

    if not skip_optimize:
        image_bytes, mime_type = _optimize_image(image_bytes, mime_type)

    models = _models_to_try()
    quota_errors = []

    for model in models:
        try:
            result = _call_gemini_model(model, api_key, image_bytes, mime_type, hint=hint)
            result['_model_used'] = model
            return result
        except GeminiApiError as e:
            if e.quota_exceeded or e.status_code in (404, 429):
                quota_errors.append(str(e))
                current_app.logger.warning(f'Gemini model {model} failed: {e}')
                continue
            raise

    raise GeminiApiError(
        'Gemini free quota exhausted. Wait a few minutes or create a new key at aistudio.google.com. '
        f'Tried: {", ".join(models)}',
        status_code=429,
        quota_exceeded=True,
    )


# Backward-compatible alias
def suggest_product_from_image(image_bytes, mime_type='image/jpeg', hint=''):
    return suggest_product_via_gemini(image_bytes, mime_type, hint=hint)
