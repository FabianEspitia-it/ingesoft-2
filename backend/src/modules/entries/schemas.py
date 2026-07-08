from __future__ import annotations

from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field, field_validator
from src.infrastructure.storage.gcs import signed_cover_url
from src.modules.entries.categories import (
    PREDEFINED_CATEGORIES,
    is_category,
    normalize_category,
)

MAX_TAG_LENGTH = 100
MAX_TAGS = 20
MAX_CATEGORIES = 10
MAX_COVER_IMAGE_URL_LENGTH = 500


class AuthorSummary(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    full_name: str
    affiliation: str


class EntryCreate(BaseModel):
    title: str = Field(min_length=1, max_length=255)
    body: str = Field(min_length=1)
    cover_image: str | None = Field(
        default=None, max_length=MAX_COVER_IMAGE_URL_LENGTH
    )
    category_names: list[str] = Field(default_factory=list, max_length=MAX_CATEGORIES)
    tags: list[str] = Field(default_factory=list, max_length=MAX_TAGS)

    @field_validator("category_names")
    @classmethod
    def validate_categories(cls, values: list[str]) -> list[str]:
        canonical: list[str] = []
        for value in values:
            canon = normalize_category(value)
            if canon is None:
                allowed = ", ".join(PREDEFINED_CATEGORIES)
                raise ValueError(
                    f"Categoría no válida: '{value}'. Debe ser una de: {allowed}."
                )
            canonical.append(canon)
        return canonical

    @field_validator("tags")
    @classmethod
    def validate_tags(cls, values: list[str]) -> list[str]:
        cleaned: list[str] = []
        for value in values:
            name = value.strip()
            if not name:
                continue
            if len(name) > MAX_TAG_LENGTH:
                raise ValueError(
                    f"Cada etiqueta debe tener máximo {MAX_TAG_LENGTH} caracteres."
                )
            cleaned.append(name)
        return cleaned


class EntryUpdate(BaseModel):
    """Partial update of an owned entry (title, body, categories, tags)."""

    title: str | None = Field(default=None, min_length=1, max_length=255)
    body: str | None = Field(default=None, min_length=1)
    cover_image: str | None = Field(
        default=None, max_length=MAX_COVER_IMAGE_URL_LENGTH
    )
    category_names: list[str] | None = Field(default=None, max_length=MAX_CATEGORIES)
    tags: list[str] | None = Field(default=None, max_length=MAX_TAGS)

    @field_validator("category_names")
    @classmethod
    def validate_categories(cls, values: list[str] | None) -> list[str] | None:
        if values is None:
            return None
        canonical: list[str] = []
        for value in values:
            canon = normalize_category(value)
            if canon is None:
                allowed = ", ".join(PREDEFINED_CATEGORIES)
                raise ValueError(
                    f"Categoría no válida: '{value}'. Debe ser una de: {allowed}."
                )
            canonical.append(canon)
        return canonical

    @field_validator("tags")
    @classmethod
    def validate_tags(cls, values: list[str] | None) -> list[str] | None:
        if values is None:
            return None
        cleaned: list[str] = []
        for value in values:
            name = value.strip()
            if not name:
                continue
            if len(name) > MAX_TAG_LENGTH:
                raise ValueError(
                    f"Cada etiqueta debe tener máximo {MAX_TAG_LENGTH} caracteres."
                )
            cleaned.append(name)
        return cleaned


class EntrySummary(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    title: str
    published_at: datetime
    view_count: int
    is_success_case: bool = False
    likes: int = 0
    comments_count: int = 0
    cover_image_url: str | None = None
    author: AuthorSummary
    categories: list[str] = Field(default_factory=list)
    tags: list[str] = Field(default_factory=list)

    @classmethod
    def from_entry(cls, entry, *, likes: int = 0, comments_count: int = 0) -> EntrySummary:
        return cls(
            id=entry.id,
            title=entry.title,
            published_at=entry.published_at,
            view_count=entry.view_count,
            is_success_case=entry.is_success_case,
            likes=likes,
            comments_count=comments_count,
            cover_image_url=signed_cover_url(entry.cover_image),
            author=AuthorSummary.model_validate(entry.author),
            categories=_categories_of(entry),
            tags=_free_tags_of(entry),
        )


class EntryDetail(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    title: str
    body: str
    published_at: datetime
    updated_at: datetime | None
    view_count: int
    is_success_case: bool = False
    cover_image: str | None
    cover_image_url: str | None
    author: AuthorSummary
    categories: list[str] = Field(default_factory=list)
    tags: list[str] = Field(default_factory=list)

    @classmethod
    def from_entry(cls, entry) -> EntryDetail:
        return cls(
            id=entry.id,
            title=entry.title,
            body=entry.body,
            published_at=entry.published_at,
            updated_at=entry.updated_at,
            view_count=entry.view_count,
            is_success_case=entry.is_success_case,
            cover_image=entry.cover_image,
            cover_image_url=signed_cover_url(entry.cover_image),
            author=AuthorSummary.model_validate(entry.author),
            categories=_categories_of(entry),
            tags=_free_tags_of(entry),
        )


class EntryListResponse(BaseModel):
    items: list[EntrySummary]
    total: int
    page: int
    page_size: int


class FeaturedEntrySummary(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    title: str
    published_at: datetime
    view_count: int
    likes: int
    comments_count: int
    cover_image_url: str | None = None
    author: AuthorSummary
    categories: list[str] = Field(default_factory=list)
    tags: list[str] = Field(default_factory=list)

    @classmethod
    def from_entry(cls, entry, likes: int, comments_count: int) -> FeaturedEntrySummary:
        return cls(
            id=entry.id,
            title=entry.title,
            published_at=entry.published_at,
            view_count=entry.view_count,
            likes=likes,
            comments_count=comments_count,
            cover_image_url=signed_cover_url(entry.cover_image),
            author=AuthorSummary.model_validate(entry.author),
            categories=_categories_of(entry),
            tags=_free_tags_of(entry),
        )


class FeaturedEntryResponse(BaseModel):
    items: list[FeaturedEntrySummary]
    total: int
    page: int
    page_size: int


class SuccessCaseUpdate(BaseModel):
    """Admin toggle to (un)feature an entry as a success case (RN-23)."""

    is_success_case: bool


class CoverImageResponse(BaseModel):
    """Result of a cover-image upload.

    ``path`` is the object path to persist on the entry; ``url`` is a short-lived
    signed URL for previewing the image immediately in the form.
    """

    path: str
    url: str | None


def _categories_of(entry) -> list[str]:
    """Tags of the entry whose name is a predefined category."""
    return [tag.name for tag in entry.tags if is_category(tag.name)]


def _free_tags_of(entry) -> list[str]:
    """Tags of the entry that are NOT predefined categories."""
    return [tag.name for tag in entry.tags if not is_category(tag.name)]
