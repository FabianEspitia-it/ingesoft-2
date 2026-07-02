from datetime import UTC, datetime

import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession

from src.infrastructure.db.models import Entry, EntryStatus, Tag, User, UserAffiliation, UserRole
from src.modules.auth.services.password import hash_password
from src.modules.search.crud import _normalize, search_terms

TEST_PASSWORD = "Password1"


@pytest.fixture
async def search_dataset(db_session: AsyncSession, test_user: User):
    second_author = User(
        email="maria@unal.edu.co",
        full_name="María García",
        password=hash_password(TEST_PASSWORD),
        affiliation=UserAffiliation.graduate,
        role=UserRole.author,
        email_verified=True,
    )
    db_session.add(second_author)
    await db_session.flush()

    growth_tag = Tag(name="Growth")
    marketing_tag = Tag(name="Marketing")
    db_session.add_all([growth_tag, marketing_tag])
    await db_session.flush()

    startup_entry = Entry(
        author_id=test_user.id,
        title="Pitch deck para startups",
        body="Contenido sobre fundraising.",
        status=EntryStatus.published,
        published_at=datetime(2026, 1, 10, tzinfo=UTC),
    )
    marketing_entry = Entry(
        author_id=second_author.id,
        title="Guía de marketing digital",
        body="Contenido sobre adquisición.",
        status=EntryStatus.published,
        published_at=datetime(2026, 1, 5, tzinfo=UTC),
    )
    hidden_entry = Entry(
        author_id=test_user.id,
        title="Borrador interno",
        body="No debería aparecer en búsqueda.",
        status=EntryStatus.rejected,
        published_at=datetime(2026, 1, 1, tzinfo=UTC),
    )

    startup_entry.tags = [growth_tag]
    marketing_entry.tags = [marketing_tag]

    db_session.add_all([startup_entry, marketing_entry, hidden_entry])
    await db_session.commit()

    return {
        "startup_entry": startup_entry,
        "marketing_entry": marketing_entry,
        "hidden_entry": hidden_entry,
        "growth_tag": growth_tag,
        "marketing_tag": marketing_tag,
        "second_author": second_author,
    }


@pytest.mark.parametrize(
    ("value", "expected"),
    [
        (None, None),
        ("", None),
        ("   ", None),
        ("  pitch  ", "pitch"),
    ],
)
def test_normalize(value, expected):
    assert _normalize(value) == expected


@pytest.mark.asyncio
async def test_search_without_filters_returns_published_entries(
    db_session: AsyncSession,
    search_dataset,
):
    results = await search_terms(db_session, None, None, None, None)

    titles = {entry.title for entry in results}
    assert titles == {"Pitch deck para startups", "Guía de marketing digital"}


@pytest.mark.asyncio
async def test_search_by_title_only(db_session: AsyncSession, search_dataset):
    results = await search_terms(db_session, None, "marketing", None, None)

    assert len(results) == 1
    assert results[0].title == "Guía de marketing digital"


@pytest.mark.asyncio
async def test_search_by_author_only(db_session: AsyncSession, search_dataset):
    results = await search_terms(db_session, None, None, "María", None)

    assert len(results) == 1
    assert results[0].author.full_name == "María García"


@pytest.mark.asyncio
async def test_search_by_title_and_author(db_session: AsyncSession, search_dataset):
    matching = await search_terms(db_session, None, "Pitch", "Autor", None)
    non_matching = await search_terms(db_session, None, "Pitch", "María", None)

    assert len(matching) == 1
    assert matching[0].title == "Pitch deck para startups"
    assert non_matching == []


@pytest.mark.asyncio
async def test_search_by_tag(db_session: AsyncSession, search_dataset):
    results = await search_terms(db_session, None, None, None, "Growth")

    assert len(results) == 1
    assert results[0].title == "Pitch deck para startups"


@pytest.mark.asyncio
async def test_search_by_terms_matches_title_or_author(
    db_session: AsyncSession,
    search_dataset,
):
    by_title = await search_terms(db_session, "marketing", None, None, None)
    by_author = await search_terms(db_session, "María", None, None, None)

    assert len(by_title) == 1
    assert by_title[0].title == "Guía de marketing digital"
    assert len(by_author) == 1
    assert by_author[0].author.full_name == "María García"


@pytest.mark.asyncio
async def test_search_endpoint_returns_matching_items(
    client: AsyncClient,
    search_dataset,
):
    response = await client.get("/search", params={"title": "Pitch"})

    assert response.status_code == 200
    payload = response.json()
    assert len(payload["items"]) == 1
    assert payload["items"][0]["title"] == "Pitch deck para startups"
    assert payload["page"] == 1
    assert payload["page_size"] == 20


@pytest.mark.asyncio
async def test_search_endpoint_uses_terms_over_advanced_filters(
    client: AsyncClient,
    search_dataset,
):
    response = await client.get(
        "/search",
        params={"terms": "María", "title": "Pitch", "author": "Autor", "tag": "Growth"},
    )

    assert response.status_code == 200
    payload = response.json()
    assert len(payload["items"]) == 1
    assert payload["items"][0]["author"]["full_name"] == "María García"
