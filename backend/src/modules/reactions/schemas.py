from datetime import datetime

from pydantic import BaseModel, ConfigDict


class ReactionCreate(BaseModel):
    type: str

    def model_post_init(self, __context) -> None:
        if self.type not in ("like", "dislike"):
            raise ValueError("El tipo de reacción debe ser 'like' o 'dislike'.")


class ReactionResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    entry_id: int
    user_id: int
    type: str
    reacted_at: datetime


class ReactionSummary(BaseModel):
    likes: int
    dislikes: int
    user_reaction: str | None = None
