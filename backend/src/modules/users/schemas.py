from pydantic import BaseModel, ConfigDict, Field
from src.infrastructure.db.models import UserAffiliation, UserRole

class UpdateUserRequest(BaseModel):
    full_name: str | None = Field(default=None, min_length=1, max_length=150)
    affiliation: UserAffiliation | None = None
    biography: str | None = None
    profile_picture: str | None = None

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