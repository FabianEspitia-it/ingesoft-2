import re

from pydantic import BaseModel, ConfigDict, EmailStr, Field, field_validator
from src.infrastructure.db.models import UserAffiliation, UserRole

UNAL_EMAIL_SUFFIX = "@unal.edu.co"
PASSWORD_PATTERN = re.compile(r"^(?=.*[A-Z])(?=.*\d).{8,}$")


class RegisterRequest(BaseModel):
    full_name: str = Field(min_length=1, max_length=150)
    email: EmailStr
    password: str = Field(min_length=8, max_length=128)
    affiliation: UserAffiliation
    accepted_terms: bool

    @field_validator("email")
    @classmethod
    def validate_unal_email(cls, value: str) -> str:
        normalized = value.lower().strip()
        if not normalized.endswith(UNAL_EMAIL_SUFFIX):
            raise ValueError(
                "Solo se permiten correos institucionales @unal.edu.co (RN-1)."
            )
        return normalized

    @field_validator("password")
    @classmethod
    def validate_password_strength(cls, value: str) -> str:
        if not PASSWORD_PATTERN.match(value):
            raise ValueError(
                "La contraseña debe tener al menos 8 caracteres, "
                "una mayúscula y un número (RN-6)."
            )
        return value

    @field_validator("accepted_terms")
    @classmethod
    def validate_terms(cls, value: bool) -> bool:
        if not value:
            raise ValueError("Debes aceptar los términos y condiciones (RN-4).")
        return value


class LoginRequest(BaseModel):
    email: EmailStr
    password: str = Field(min_length=1, max_length=128)

    @field_validator("email")
    @classmethod
    def normalize_email(cls, value: str) -> str:
        return value.lower().strip()


class VerifyEmailRequest(BaseModel):
    token: str = Field(min_length=1)


class UserResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    
    id: int
    email: str
    full_name: str
    affiliation: UserAffiliation
    role: UserRole
    email_verified: bool
    biography: str | None
    profile_picture: str | None

class MessageResponse(BaseModel):
    message: str
