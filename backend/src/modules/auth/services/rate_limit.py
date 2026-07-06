from collections import defaultdict
from datetime import UTC, datetime, timedelta

MAX_LOGIN_ATTEMPTS = 5
LOGIN_WINDOW = timedelta(minutes=15)

_attempts: dict[str, list[datetime]] = defaultdict(list)


def check_login_rate_limit(email: str) -> None:
    """Raise ValueError if the email has exceeded login attempts."""
    now = datetime.now(UTC)
    window_start = now - LOGIN_WINDOW
    recent = [ts for ts in _attempts[email] if ts > window_start]
    _attempts[email] = recent

    if len(recent) >= MAX_LOGIN_ATTEMPTS:
        raise ValueError(
            "Demasiados intentos fallidos. Intenta de nuevo en unos minutos."
        )


def record_failed_login(email: str) -> None:
    """Record a failed login attempt for rate limiting."""
    _attempts[email].append(datetime.now(UTC))


def clear_login_attempts(email: str) -> None:
    """Clear failed login attempts after a successful login."""
    _attempts.pop(email, None)
