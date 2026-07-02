"""
Predefined categories for entries.

Design note: the schema (per the approved data model) has no dedicated
`categories` table. Categories are modelled as a *reserved set of tags*: they are
stored in the existing `tags` / `entry_tags` tables just like free tags, but
their names must belong to this predefined list. On read, an entry's tags are
partitioned into "categories" (name matches this list) and free "tags".

Editing this list is the only thing needed to change the available categories.
"""

from fastapi import APIRouter

# Canonical, display-ready category names. Edit this list to change the options.
PREDEFINED_CATEGORIES: list[str] = [
    "Startups",
    "Ingeniería de Software",
    "Emprendimiento",
    "Investigación",
    "Comunidad UNAL",
]

# Map from case-insensitive form -> canonical spelling.
_CATEGORY_BY_NORMALIZED = {name.casefold(): name for name in PREDEFINED_CATEGORIES}


def normalize_category(name: str) -> str | None:
    """Return the canonical category name if `name` matches a predefined
    category (case-insensitively, ignoring surrounding whitespace); else None."""
    return _CATEGORY_BY_NORMALIZED.get(name.strip().casefold())


def is_category(tag_name: str) -> bool:
    """True if a stored tag name corresponds to a predefined category."""
    return tag_name.strip().casefold() in _CATEGORY_BY_NORMALIZED


categories_router = APIRouter(prefix="/categories", tags=["Categories"])


@categories_router.get("", response_model=list[str])
async def list_categories() -> list[str]:
    """Return the predefined categories used to populate the entry editor."""
    return PREDEFINED_CATEGORIES
