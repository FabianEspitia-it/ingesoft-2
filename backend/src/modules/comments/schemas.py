from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field, field_validator

MAX_COMMENT_LENGTH = 2000


class CommentAuthor(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    full_name: str
    affiliation: str


class CommentCreate(BaseModel):
    content: str = Field(min_length=1, max_length=MAX_COMMENT_LENGTH)

    @field_validator("content")
    @classmethod
    def strip_content(cls, value: str) -> str:
        content = value.strip()
        if not content:
            raise ValueError("El comentario no puede estar vacío.")
        return content


class CommentUpdate(BaseModel):
    content: str = Field(min_length=1, max_length=MAX_COMMENT_LENGTH)

    @field_validator("content")
    @classmethod
    def strip_content(cls, value: str) -> str:
        content = value.strip()
        if not content:
            raise ValueError("El comentario no puede estar vacío.")
        return content


class CommentResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    content: str
    published_at: datetime
    edited_at: datetime | None
    author: CommentAuthor


class CommentListResponse(BaseModel):
    items: list[CommentResponse]
    total: int
