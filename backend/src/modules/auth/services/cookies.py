from fastapi import Response
from src.core.config import settings

SESSION_COOKIE_NAME = "session"


def set_session_cookie(response: Response, token: str) -> None:
    """Set the session cookie on the response."""
    response.set_cookie(
        key=SESSION_COOKIE_NAME,
        value=token,
        httponly=True,
        secure=settings.COOKIE_SECURE,
        samesite=settings.COOKIE_SAMESITE,
        path="/",
        domain=settings.COOKIE_DOMAIN or None,
        max_age=settings.JWT_EXPIRATION_HOURS * 3600,
    )


def clear_session_cookie(response: Response) -> None:
    """Remove the session cookie from the response."""
    response.delete_cookie(
        key=SESSION_COOKIE_NAME,
        path="/",
        domain=settings.COOKIE_DOMAIN or None,
    )
