import datetime as dt
import uuid
from datetime import date, datetime
from decimal import Decimal
from typing import List, Optional

import sqlalchemy as sa
from sqlalchemy import (
    Boolean,
    CheckConstraint,
    Date,
    ForeignKey,
    Index,
    Integer,
    Numeric,
    SmallInteger,
    String,
    Text,
    Time,
    UniqueConstraint,
    func,
    text,
)
from sqlalchemy.dialects.postgresql import ARRAY, JSONB, REAL, TIMESTAMP, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.sql import expression

from src.database import Base, engine

# ============================================================================
# User and Authentication Models
# ============================================================================


class User(Base):
    """User accounts with authentication information."""

    __tablename__ = "users"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, server_default=func.gen_random_uuid()
    )
    firebase_uid: Mapped[str] = mapped_column(
        Text, nullable=False, comment="Firebase user ID"
    )
    email: Mapped[str] = mapped_column(Text, nullable=False)
    phone_number: Mapped[str | None] = mapped_column(Text, nullable=True)
    full_name: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        TIMESTAMP(timezone=True), server_default=func.now(), nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        TIMESTAMP(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )
    deleted_at: Mapped[datetime | None] = mapped_column(
        TIMESTAMP(timezone=True), nullable=True
    )

    # Relationships
    profile: Mapped["Profile"] = relationship(back_populates="user", uselist=False)
    recruiter: Mapped["Recruiter"] = relationship(back_populates="user", uselist=False)
    api_access_tokens: Mapped[List["ApiAccessToken"]] = relationship(
        back_populates="user"
    )

    __table_args__ = (
        UniqueConstraint("firebase_uid", name="users_firebase_uid_key"),
        UniqueConstraint("email", name="users_email_key"),
        Index("idx_users_firebase_uid", "firebase_uid"),
        Index("idx_users_email", "email"),
        Index("idx_users_created_at", "created_at"),
        Index("idx_users_deleted_at", "deleted_at"),
        # Trigram index for text search on full_name (ILIKE operations)
        Index(
            "idx_users_full_name_trgm",
            "full_name",
            postgresql_using="gin",
            postgresql_ops={"full_name": "gin_trgm_ops"},
        ),
        # B-tree index for sorting by full_name (when sort=name)
        Index("idx_users_full_name_btree", "full_name"),
    )

Base.metadata.create_all(bind=engine)