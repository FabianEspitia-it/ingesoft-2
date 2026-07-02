from pydantic import BaseModel, ConfigDict, Field

class CreateProjectRequest(BaseModel):
    title: str = Field(min_length=1, max_length=200)
    description: str | None = None
    url: str | None = None

class UpdateProjectRequest(BaseModel):
    title: str | None = Field(default=None, min_length=1, max_length=200)
    description: str | None = None
    url: str | None = None

class ProjectResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    user_id: int
    title: str 
    description: str | None 
    url: str | None

class ProjectListResponse(BaseModel):
    items: list[ProjectResponse]
    total: int
    page: int
    page_size: int