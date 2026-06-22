from flask import Blueprint, jsonify, request
from flask_jwt_extended import jwt_required, get_jwt_identity

from models import User
from utils.gemini_product import GeminiApiError, suggest_product_from_image

product_ai_bp = Blueprint('product_ai', __name__)

ALLOWED_MIME = {
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/webp',
    'image/gif',
}


def _is_admin():
    identity = get_jwt_identity()
    user_id = identity.get('id') if isinstance(identity, dict) else identity
    user = User.query.get(user_id)
    return user and user.is_admin


@product_ai_bp.route('/admin/products/ai-suggest', methods=['POST'])
@jwt_required()
def ai_suggest_product():
    """Analyze a product photo with Gemini and suggest catalog fields."""
    if not _is_admin():
        return jsonify({'success': False, 'error': 'Admin access required'}), 403

    if 'image' not in request.files:
        return jsonify({'success': False, 'error': 'Product image is required'}), 400

    file = request.files['image']
    if not file or not file.filename:
        return jsonify({'success': False, 'error': 'No image file selected'}), 400

    mime = (file.mimetype or 'image/jpeg').lower()
    if mime not in ALLOWED_MIME:
        return jsonify({'success': False, 'error': 'Unsupported image type'}), 400

    hint = (request.form.get('hint') or '').strip()[:500]

    try:
        image_bytes = file.read()
        if len(image_bytes) > 8 * 1024 * 1024:
            return jsonify({'success': False, 'error': 'Image must be under 8MB'}), 400

        suggestions = suggest_product_from_image(image_bytes, mime_type=mime, hint=hint)
        model_used = suggestions.pop('_model_used', None)
        return jsonify({
            'success': True,
            'suggestions': suggestions,
            'model_used': model_used,
        }), 200
    except ValueError as e:
        return jsonify({'success': False, 'error': str(e)}), 503
    except GeminiApiError as e:
        print(f'AI suggest error: {e}')
        status = 429 if e.quota_exceeded else min(e.status_code, 502)
        return jsonify({'success': False, 'error': str(e)}), status
    except Exception as e:
        print(f'AI suggest error: {e}')
        return jsonify({
            'success': False,
            'error': str(e) or 'Failed to analyze image with Gemini.',
        }), 500
