import enum
from datetime import datetime

from sqlalchemy import (
    Boolean,
    DateTime,
    Enum,
    ForeignKey,
    Index,
    Integer,
    String,
    Text,
    UniqueConstraint,
    func,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship
from src.infrastructure.db.database import Base

# ============================================================================
# Enumerations
# ============================================================================


class UserRole(str, enum.Enum):
    author = "author"
    administrator = "administrator"


class UserAffiliation(str, enum.Enum):
    student = "student"
    graduate = "graduate"
    professor = "professor"


class ReactionType(str, enum.Enum):
    like = "like"
    dislike = "dislike"


class EntryStatus(str, enum.Enum):
    published = "published"
    rejected = "rejected"


# ============================================================================
# Users and Session
# ============================================================================


class User(Base):
    """Registered platform user."""

    __tablename__ = "users"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    email: Mapped[str] = mapped_column(
        String(255),
        nullable=False,
        unique=True,
        comment="Only @unal.edu.co addresses allowed (RN-1, RN-3)",
    )
    full_name: Mapped[str] = mapped_column(
        String(150), nullable=False, comment="Full name (RN-32)"
    )
    password: Mapped[str] = mapped_column(
        String(255), nullable=False, comment="bcrypt hash, factor >= 12 (NFR-2)"
    )
    affiliation: Mapped[UserAffiliation] = mapped_column(
        Enum(UserAffiliation), nullable=False, comment="RN-5"
    )
    role: Mapped[UserRole] = mapped_column(
        Enum(UserRole),
        nullable=False,
        default=UserRole.author,
        comment="RN-7; Visitor role is not persisted",
    )
    email_verified: Mapped[bool] = mapped_column(
        Boolean,
        nullable=False,
        default=False,
        comment="Must be verified before access (RN-2, NFR-4)",
    )
    biography: Mapped[str | None] = mapped_column(Text, nullable=True)
    profile_picture: Mapped[str | None] = mapped_column(String(500), nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now()
    )
    deleted_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True, comment="Soft-delete timestamp"
    )

    # Relationships
    sessions: Mapped[list["Session"]] = relationship(back_populates="user")
    external_links: Mapped[list["ExternalLink"]] = relationship(back_populates="user")
    projects: Mapped[list["Project"]] = relationship(back_populates="user")
    entries: Mapped[list["Entry"]] = relationship(back_populates="author")
    comments: Mapped[list["Comment"]] = relationship(back_populates="author")
    reactions: Mapped[list["Reaction"]] = relationship(back_populates="user")

    __table_args__ = (
        UniqueConstraint("email", name="users_email_key"),
        Index("idx_users_email", "email"),
        Index("idx_users_full_name", "full_name"),
    )


class ExternalLink(Base):
    """External links associated with a user profile."""

    __tablename__ = "external_links"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    user_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("users.id"), nullable=False
    )
    title: Mapped[str | None] = mapped_column(String(100), nullable=True)
    url: Mapped[str] = mapped_column(String(500), nullable=False)

    # Relationships
    user: Mapped["User"] = relationship(back_populates="external_links")

    __table_args__ = (Index("idx_external_links_user_id", "user_id"),)


class Project(Base):
    """Portfolio project linked to a user (RN-32)."""

    __tablename__ = "projects"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    user_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("users.id"), nullable=False
    )
    title: Mapped[str] = mapped_column(String(200), nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    url: Mapped[str | None] = mapped_column(String(500), nullable=True)

    # Relationships
    user: Mapped["User"] = relationship(back_populates="projects")

    __table_args__ = (Index("idx_projects_user_id", "user_id"),)


class Session(Base):
    """Active authentication sessions (JWT tokens)."""

    __tablename__ = "sessions"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    user_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("users.id"), nullable=False
    )
    token: Mapped[str] = mapped_column(String(500), nullable=False, unique=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now()
    )
    expires_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, comment="JWT lifetime <= 24h (NFR-6)"
    )
    is_active: Mapped[bool] = mapped_column(
        Boolean,
        nullable=False,
        default=True,
        comment="Revoked on logout (RN-37)",
    )

    # Relationships
    user: Mapped["User"] = relationship(back_populates="sessions")

    __table_args__ = (
        UniqueConstraint("token", name="sessions_token_key"),
        Index("idx_sessions_token", "token"),
        Index("idx_sessions_user_id", "user_id"),
    )


# ============================================================================
# Content: Entries
# ============================================================================


class Entry(Base):
    """Blog/forum entries published by authors."""

    __tablename__ = "entries"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    author_id: Mapped[int] = mapped_column(
        Integer,
        ForeignKey("users.id"),
        nullable=False,
        comment="Author writes Entry",
    )
    title: Mapped[str] = mapped_column(
        String(255), nullable=False, comment="Required (RN-15)"
    )
    body: Mapped[str] = mapped_column(Text, nullable=False, comment="Required (RN-15)")
    cover_image: Mapped[str | None] = mapped_column(
        String(500),
        nullable=True,
        comment="Optional, JPG/PNG <=5MB in Cloud Storage (RN-18, NFR-13)",
    )
    status: Mapped[EntryStatus] = mapped_column(
        Enum(EntryStatus),
        nullable=False,
        default=EntryStatus.published,
    )
    is_success_case: Mapped[bool] = mapped_column(
        Boolean,
        nullable=False,
        default=False,
        comment="Flagged by admin only (RN-23)",
    )
    view_count: Mapped[int] = mapped_column(
        Integer, nullable=False, default=0, comment="RN-26"
    )
    published_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now()
    )
    updated_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
        comment="Shown if entry was edited (RN-19)",
    )
    deleted_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True, comment="Soft-delete timestamp"
    )

    # Relationships
    author: Mapped["User"] = relationship(back_populates="entries")
    tags: Mapped[list["Tag"]] = relationship(
        secondary="entry_tags", back_populates="entries"
    )
    comments: Mapped[list["Comment"]] = relationship(back_populates="entry")
    reactions: Mapped[list["Reaction"]] = relationship(back_populates="entry")

    __table_args__ = (
        Index("idx_entries_author_id", "author_id"),
        Index("idx_entries_title", "title"),
        Index("idx_entries_published_at", "published_at"),
        Index("idx_entries_is_success_case", "is_success_case"),
    )


# ============================================================================
# Taxonomy
# ============================================================================


class Tag(Base):
    """Free-form tags added by authors (RN-17, FR-5, RN-16)."""

    __tablename__ = "tags"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    name: Mapped[str] = mapped_column(String(100), nullable=False, unique=True)

    # Relationships
    entries: Mapped[list["Entry"]] = relationship(
        secondary="entry_tags", back_populates="tags"
    )

    __table_args__ = (UniqueConstraint("name", name="tags_name_key"),)


class EntryTag(Base):
    """N:M association between entries and tags."""

    __tablename__ = "entry_tags"

    entry_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("entries.id"), primary_key=True, nullable=False
    )
    tag_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("tags.id"), primary_key=True, nullable=False
    )


# ============================================================================
# Interaction
# ============================================================================


class Comment(Base):
    """Comments published on an entry."""

    __tablename__ = "comments"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    entry_id: Mapped[int] = mapped_column(
        Integer,
        ForeignKey("entries.id", ondelete="CASCADE"),
        nullable=False,
        comment="Entry contains Comment; ON DELETE CASCADE (RN-20)",
    )
    author_id: Mapped[int] = mapped_column(
        Integer,
        ForeignKey("users.id"),
        nullable=False,
        comment="Author publishes Comment",
    )
    content: Mapped[str] = mapped_column(Text, nullable=False)
    published_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now()
    )
    edited_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )

    # Relationships
    entry: Mapped["Entry"] = relationship(back_populates="comments")
    author: Mapped["User"] = relationship(back_populates="comments")

    __table_args__ = (
        Index("idx_comments_entry_id", "entry_id"),
        Index("idx_comments_author_id", "author_id"),
    )


class Reaction(Base):
    """Like / dislike reactions on entries (RN-21)."""

    __tablename__ = "reactions"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    entry_id: Mapped[int] = mapped_column(
        Integer,
        ForeignKey("entries.id"),
        nullable=False,
        comment="Entry receives Reaction",
    )
    user_id: Mapped[int] = mapped_column(
        Integer,
        ForeignKey("users.id"),
        nullable=False,
        comment="User performs Reaction",
    )
    type: Mapped[ReactionType] = mapped_column(Enum(ReactionType), nullable=False)
    reacted_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now()
    )

    # Relationships
    entry: Mapped["Entry"] = relationship(back_populates="reactions")
    user: Mapped["User"] = relationship(back_populates="reactions")

    __table_args__ = (
        UniqueConstraint(
            "user_id",
            "entry_id",
            name="reactions_user_entry_key",
            comment="One reaction per user per entry (RN-21)",
        ),
        Index("idx_reactions_user_entry", "user_id", "entry_id", unique=True),
        Index("idx_reactions_entry_id", "entry_id"),
    )
