import jwt
from fastapi import APIRouter, Depends, HTTPException, Request, Response, status
from sqlalchemy.ext.asyncio import AsyncSession
from src.api.dependencies import get_current_user
from src.infrastructure.db.database import get_db
from src.infrastructure.db.models import User
from src.modules.auth import crud
from src.modules.auth.schemas import (
    LoginRequest,
    MessageResponse,
    RegisterRequest,
    UserResponse,
    VerifyEmailRequest,
)
from src.modules.auth.services.cookies import clear_session_cookie, set_session_cookie
from src.modules.auth.services.email import send_verification_email
from src.modules.auth.services.password import verify_password
from src.modules.auth.services.rate_limit import (
    check_login_rate_limit,
    clear_login_attempts,
    record_failed_login,
)
from src.modules.auth.services.tokens import (
    EMAIL_VERIFY_TOKEN_TYPE,
    create_email_verification_token,
    create_session_token,
    decode_token,
)

auth_router = APIRouter(prefix="/auth", tags=["Auth"])


async def _start_session(
    db: AsyncSession,
    response: Response,
    user: User,
) -> UserResponse:
    token, expires_at = create_session_token(user.id)
    await crud.create_session(
        db,
        user_id=user.id,
        token=token,
        expires_at=expires_at,
    )
    set_session_cookie(response, token)
    return UserResponse.model_validate(user)


@auth_router.post(
    "/register",
    response_model=MessageResponse,
    status_code=status.HTTP_201_CREATED,
)
async def register(
    payload: RegisterRequest,
    db: AsyncSession = Depends(get_db),
):
    """Register a new author account."""
    existing = await crud.get_user_by_email(db, payload.email)
    if existing is not None:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Ya existe una cuenta con este correo institucional.",
        )

    user = await crud.create_user(db, payload)
    verification_token = create_email_verification_token(user.id)
    send_verification_email(user, verification_token)

    return MessageResponse(
        message=(
            "Cuenta creada. Revisa tu correo institucional para verificar tu cuenta."
        )
    )


@auth_router.post("/verify-email", response_model=UserResponse)
async def verify_email(
    payload: VerifyEmailRequest,
    response: Response,
    db: AsyncSession = Depends(get_db),
):
    """Verify institutional email and start session."""
    try:
        token_payload = decode_token(payload.token, EMAIL_VERIFY_TOKEN_TYPE)
        user_id = int(token_payload["sub"])
    except (jwt.InvalidTokenError, KeyError, ValueError):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="El enlace de verificación es inválido o ha expirado.",
        ) from None

    user = await crud.get_user_by_id(db, user_id)
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="El enlace de verificación es inválido o ha expirado.",
        )

    if not user.email_verified:
        user = await crud.mark_email_verified(db, user)

    return await _start_session(db, response, user)


@auth_router.post("/login", response_model=UserResponse)
async def login(
    payload: LoginRequest,
    response: Response,
    db: AsyncSession = Depends(get_db),
):
    """Authenticate with institutional email and password."""
    try:
        check_login_rate_limit(payload.email)
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail=str(exc),
        ) from exc

    user = await crud.get_user_by_email(db, payload.email)
    if user is None or not verify_password(payload.password, user.password):
        if user is not None:
            record_failed_login(payload.email)
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Correo o contraseña incorrectos.",
        )

    if not user.email_verified:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Debes verificar tu correo institucional antes de iniciar sesión.",
        )

    clear_login_attempts(payload.email)
    return await _start_session(db, response, user)


@auth_router.post("/logout", response_model=MessageResponse)
async def logout(
    request: Request,
    response: Response,
    db: AsyncSession = Depends(get_db),
):
    """Revoke active session and clear cookie."""
    token = request.cookies.get("session")
    if token:
        session = await crud.get_active_session_by_token(db, token)
        if session is not None:
            await crud.revoke_session(db, session)

    clear_session_cookie(response)
    return MessageResponse(message="Sesión cerrada correctamente.")


@auth_router.get("/me", response_model=UserResponse)
async def me(current_user: User = Depends(get_current_user)):
    """Return the currently authenticated user."""
    return UserResponse.model_validate(current_user)
