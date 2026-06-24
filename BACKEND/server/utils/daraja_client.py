import base64
import logging
import time
from datetime import datetime, timedelta

import requests
from flask import current_app
from requests.adapters import HTTPAdapter
from urllib3.util.retry import Retry

logger = logging.getLogger(__name__)

_TOKEN_CACHE = {
    'token': None,
    'expires_at': None,
}

_RETRYABLE_EXCEPTIONS = (
    requests.exceptions.ConnectionError,
    requests.exceptions.Timeout,
    requests.exceptions.ChunkedEncodingError,
)


def _build_session():
    """Session tuned for flaky Safaricom sandbox connections."""
    session = requests.Session()
    retry = Retry(
        total=3,
        connect=3,
        read=3,
        backoff_factor=1.5,
        status_forcelist=(429, 500, 502, 503, 504),
        allowed_methods=frozenset(['GET', 'POST']),
        raise_on_status=False,
    )
    adapter = HTTPAdapter(max_retries=retry)
    session.mount('https://', adapter)
    session.headers.update({
        'Accept': 'application/json',
        'Connection': 'close',
        'User-Agent': 'ShoeLocker-Daraja/1.0',
    })
    return session


def _daraja_get(url, headers, timeout=45):
    last_error = None
    for attempt in range(1, 4):
        session = _build_session()
        try:
            response = session.get(url, headers=headers, timeout=timeout)
            return response
        except _RETRYABLE_EXCEPTIONS as exc:
            last_error = exc
            logger.warning(
                'Daraja GET attempt %s failed for %s: %s',
                attempt,
                url,
                exc,
            )
            if attempt < 3:
                time.sleep(1.5 * attempt)
        finally:
            session.close()
    raise Exception(f'Network error: {last_error}')


def _daraja_post(url, headers, payload, timeout=45):
    last_error = None
    for attempt in range(1, 4):
        session = _build_session()
        try:
            response = session.post(
                url,
                json=payload,
                headers=headers,
                timeout=timeout,
            )
            return response
        except _RETRYABLE_EXCEPTIONS as exc:
            last_error = exc
            logger.warning(
                'Daraja POST attempt %s failed for %s: %s',
                attempt,
                url,
                exc,
            )
            if attempt < 3:
                time.sleep(1.5 * attempt)
        finally:
            session.close()
    raise Exception(f'Network error: {last_error}')


def _invalidate_token_cache():
    _TOKEN_CACHE['token'] = None
    _TOKEN_CACHE['expires_at'] = None


def get_mpesa_access_token(force_refresh=False):
    """OAuth token with in-memory cache (Safaricom tokens last ~1 hour)."""
    now = datetime.utcnow()
    cached = _TOKEN_CACHE.get('token')
    expires_at = _TOKEN_CACHE.get('expires_at')
    if (
        not force_refresh
        and cached
        and expires_at
        and now < expires_at
    ):
        return cached

    url = current_app.config.get('DARAJA_AUTH_URL')
    consumer_key = current_app.config.get('MPESA_CONSUMER_KEY')
    consumer_secret = current_app.config.get('MPESA_CONSUMER_SECRET')

    if not consumer_key or not consumer_secret:
        raise Exception(
            'Missing MPESA credentials. Set MPESA_CONSUMER_KEY and '
            'MPESA_CONSUMER_SECRET in your .env file.'
        )

    logger.info('Getting M-Pesa access token from: %s', url)

    credentials = f'{consumer_key}:{consumer_secret}'
    encoded_credentials = base64.b64encode(credentials.encode()).decode()
    headers = {'Authorization': f'Basic {encoded_credentials}'}

    response = _daraja_get(url, headers)
    logger.info('M-Pesa auth response status: %s', response.status_code)

    content_type = response.headers.get('content-type', '')
    if 'application/json' not in content_type:
        if response.status_code == 400:
            raise Exception(
                'Invalid MPESA_CONSUMER_KEY or MPESA_CONSUMER_SECRET. '
                'Use fresh sandbox credentials from https://developer.safaricom.co.ke/'
            )
        raise Exception(
            f'M-Pesa API returned non-JSON response. Status: {response.status_code}'
        )

    response_data = response.json()
    token = response_data.get('access_token')
    if not token:
        error_msg = response_data.get('error_description', 'Unknown error')
        raise Exception(f'Error obtaining access token: {error_msg}')

    expires_in = int(response_data.get('expires_in', 3500))
    _TOKEN_CACHE['token'] = token
    _TOKEN_CACHE['expires_at'] = now + timedelta(seconds=max(expires_in - 60, 60))
    logger.info('M-Pesa access token obtained successfully')
    return token


def generate_mpesa_password(timestamp):
    shortcode = current_app.config['MPESA_SHORTCODE']
    passkey = current_app.config['MPESA_PASSKEY']
    return base64.b64encode(f'{shortcode}{passkey}{timestamp}'.encode()).decode()


def sanitize_phone_number(phone):
    """Convert phone number to 2547XXXXXXXX format for M-Pesa API."""
    if not phone:
        return None

    phone = ''.join(c for c in str(phone) if c.isdigit())

    if phone.startswith('0') and len(phone) == 10:
        return '254' + phone[1:]
    if phone.startswith('254') and len(phone) == 12:
        return phone
    if len(phone) == 9:
        return '254' + phone
    if len(phone) == 10 and not phone.startswith('0'):
        return '254' + phone

    logger.warning('Invalid phone number format: %s', phone)
    return None


def initiate_stk_push(phone_number, amount, order_id, description='ShoeLocker Payment'):
    """Initiate M-Pesa STK Push via Safaricom Daraja API."""
    logger.info(
        'Starting STK push for order %s, amount %s, phone %s',
        order_id,
        amount,
        phone_number,
    )

    sanitized_phone = sanitize_phone_number(phone_number)
    if not sanitized_phone:
        return {
            'error': (
                'Invalid phone number format. Use 0712345678, '
                '+254712345678, or 254712345678'
            ),
        }, 400

    try:
        amount_int = int(round(float(amount)))
        if amount_int <= 0:
            return {'error': 'Amount must be greater than 0'}, 400
    except (ValueError, TypeError):
        return {'error': 'Invalid amount'}, 400

    callback_url = current_app.config.get('MPESA_CALLBACK_URL')
    if not callback_url:
        return {
            'error': (
                'MPESA_CALLBACK_URL is not configured. '
                'Set it to your public URL + /payments/callback (e.g. ngrok).'
            ),
        }, 500

    transaction_type = current_app.config.get(
        'MPESA_TRANSACTION_TYPE',
        'CustomerPayBillOnline',
    )

    for auth_attempt in range(2):
        try:
            access_token = get_mpesa_access_token(force_refresh=auth_attempt > 0)
            break
        except Exception as exc:
            if auth_attempt == 1:
                logger.error('STK auth failed after retry: %s', exc)
                return {'error': str(exc)}, 502

    timestamp = datetime.now().strftime('%Y%m%d%H%M%S')
    password = generate_mpesa_password(timestamp)

    headers = {
        'Authorization': f'Bearer {access_token}',
        'Content-Type': 'application/json',
    }

    payload = {
        'BusinessShortCode': current_app.config['MPESA_SHORTCODE'],
        'Password': password,
        'Timestamp': timestamp,
        'TransactionType': transaction_type,
        'Amount': amount_int,
        'PartyA': sanitized_phone,
        'PartyB': current_app.config['MPESA_SHORTCODE'],
        'PhoneNumber': sanitized_phone,
        'CallBackURL': callback_url,
        'AccountReference': str(order_id)[:12],
        'TransactionDesc': description[:13],
    }

    stk_push_url = current_app.config.get(
        'DARAJA_STK_PUSH_URL',
        current_app.config.get('MPESA_STK_PUSH_URL'),
    )
    logger.info('Making STK push request to: %s', stk_push_url)

    try:
        response = _daraja_post(stk_push_url, headers, payload)
    except Exception as exc:
        logger.error('STK Push network error: %s', exc)
        return {'error': str(exc)}, 502

    logger.info('STK push response status: %s', response.status_code)

    content_type = response.headers.get('content-type', '')
    if 'application/json' not in content_type:
        return {
            'error': (
                f'M-Pesa API returned non-JSON response. Status: {response.status_code}'
            ),
        }, 502

    response_data = response.json()
    logger.info('STK push response: %s', response_data)

    if response.status_code == 200 and response_data.get('ResponseCode') == '0':
        return response_data, 200

    error_msg = response_data.get(
        'errorMessage',
        response_data.get('ResponseDescription', 'STK push failed'),
    )
    return {'error': f'STK push failed: {error_msg}'}, 400
