import bcrypt

BCRYPT_ROUNDS = 12


def hash_password(plain_password: str) -> str:
    """Hash a password using bcrypt with factor >= 12 (NFR-2)."""
    password_bytes = plain_password.encode("utf-8")
    salt = bcrypt.gensalt(rounds=BCRYPT_ROUNDS)
    return bcrypt.hashpw(password_bytes, salt).decode("utf-8")


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify a plain password against a bcrypt hash."""
    return bcrypt.checkpw(
        plain_password.encode("utf-8"),
        hashed_password.encode("utf-8"),
    )
