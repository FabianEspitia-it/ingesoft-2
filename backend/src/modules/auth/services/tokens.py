from datetime import UTC, datetime, timedelta
from uuid import uuid4

import jwt
from src.core.config import settings

SESSION_TOKEN_TYPE = "session"
EMAIL_VERIFY_TOKEN_TYPE = "email_verify"
EMAIL_VERIFY_EXPIRATION_HOURS = 48


def _encode(payload: dict, expiration: timedelta) -> str:
    now = datetime.now(UTC)
    token_payload = {
        **payload,
        "iat": now,
        "exp": now + expiration,
        "jti": str(uuid4()),
    }
    return jwt.encode(token_payload, settings.JWT_SECRET, algorithm="HS256")


def create_session_token(user_id: int) -> tuple[str, datetime]:
    """Create a JWT session token (NFR-1, NFR-6)."""
    expiration = timedelta(hours=settings.JWT_EXPIRATION_HOURS)
    token = _encode(
        {"sub": str(user_id), "type": SESSION_TOKEN_TYPE},
        expiration,
    )
    return token, datetime.now(UTC) + expiration


def create_email_verification_token(user_id: int) -> str:
    """Create a one-time email verification JWT."""
    expiration = timedelta(hours=EMAIL_VERIFY_EXPIRATION_HOURS)
    return _encode(
        {"sub": str(user_id), "type": EMAIL_VERIFY_TOKEN_TYPE},
        expiration,
    )


def decode_token(token: str, expected_type: str) -> dict:
    """Decode and validate a JWT, ensuring it matches the expected type."""
    payload = jwt.decode(token, settings.JWT_SECRET, algorithms=["HS256"])
    if payload.get("type") != expected_type:
        raise jwt.InvalidTokenError("Tipo de token inválido.")
    return payload
