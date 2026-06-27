from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class AuthorSummary(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    full_name: str
    affiliation: str


class EntryCreate(BaseModel):
    title: str = Field(min_length=1, max_length=255)
    body: str = Field(min_length=1)


class EntrySummary(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    title: str
    published_at: datetime
    view_count: int
    author: AuthorSummary


class EntryDetail(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    title: str
    body: str
    published_at: datetime
    updated_at: datetime | None
    view_count: int
    cover_image: str | None
    author: AuthorSummary


class EntryListResponse(BaseModel):
    items: list[EntrySummary]
    total: int
    page: int
    page_size: int
