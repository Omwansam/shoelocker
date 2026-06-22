"""Lightweight store email helper — uses Flask-Mail config when available."""
import smtplib
from email.message import EmailMessage

from flask import current_app


def send_store_email(to_address, subject, body):
    """Send a plain-text email if SMTP is configured; otherwise no-op."""
    cfg = current_app.config
    server = cfg.get('MAIL_SERVER')
    username = cfg.get('MAIL_USERNAME')
    password = cfg.get('MAIL_PASSWORD')
    sender = cfg.get('MAIL_DEFAULT_SENDER') or username

    if not server or server == 'smtp.example.com' or not username or not password:
        current_app.logger.info('SMTP not configured — skipping send to %s', to_address)
        return False

    msg = EmailMessage()
    msg['Subject'] = subject
    msg['From'] = sender
    msg['To'] = to_address
    msg.set_content(body)

    port = int(cfg.get('MAIL_PORT', 587))
    use_tls = cfg.get('MAIL_USE_TLS', True)

    with smtplib.SMTP(server, port, timeout=15) as smtp:
        if use_tls:
            smtp.starttls()
        smtp.login(username, password)
        smtp.send_message(msg)

    return True
