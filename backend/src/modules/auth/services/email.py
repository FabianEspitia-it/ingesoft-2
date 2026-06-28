import logging

import resend
from src.core.config import settings
from src.infrastructure.db.models import User

logger = logging.getLogger(__name__)


def send_verification_email(user: User, verification_token: str) -> None:
    """Send an email verification link via Resend (NFR-4)."""
    if not settings.RESEND_KEY or not settings.RESEND_FROM_EMAIL:
        logger.warning(
            "Resend no configurado; omitiendo envío de correo a %s",
            user.email,
        )
        return

    resend.api_key = settings.RESEND_KEY
    verify_link = (
        f"{settings.FRONTEND_URL.rstrip('/')}/auth/verify?token={verification_token}"
    )

    resend.Emails.send(
        {
            "from": settings.RESEND_FROM_EMAIL,
            "to": [user.email],
            "subject": "Verifica tu cuenta — UN Silicon Valley",
            "html": (
                f"<p>Hola {user.full_name},</p>"
                "<p>Gracias por registrarte en UN Silicon Valley.</p>"
                f'<p><a href="{verify_link}">Verifica tu correo institucional</a></p>'
                "<p>Si no creaste esta cuenta, ignora este mensaje.</p>"
            ),
        }
    )
