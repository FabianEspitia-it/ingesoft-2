from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload
from src.infrastructure.db.models import Project, User
from src.modules.projects.schemas import CreateProjectRequest, UpdateProjectRequest
 
 
async def list_projects(
        db: AsyncSession,
        *,
        page: int = 1,
        page_size: int = 20,
        user_id: int | None = None,
) -> tuple[list[Project], int]:
    offset = (page - 1) * page_size
 
    count_query = select(func.count()).select_from(Project)
    query = select(Project).options(selectinload(Project.user))
 
    if user_id is not None:
        count_query = count_query.where(Project.user_id == user_id)
        query = query.where(Project.user_id == user_id)
 
    count_result = await db.execute(count_query)
    total = count_result.scalar_one()
 
    result = await db.execute(query.offset(offset).limit(page_size))
    return list(result.scalars().all()), total
 
 
async def get_project_by_id(
        db: AsyncSession,
        project_id: int
) -> Project | None:
    result = await db.execute(
        select(Project)
        .options(selectinload(Project.user))
        .where(Project.id == project_id)
    )
    return result.scalar_one_or_none()
 
 
async def create_project(
        db: AsyncSession,
        *,
        user: User,
        payload: CreateProjectRequest,
) -> Project:
    project = Project(
        user_id=user.id,
        title=payload.title.strip(),
        description=payload.description.strip() if payload.description else None,
        url=payload.url.strip() if payload.url else None,
    )
    db.add(project)
    await db.flush()
    result = await db.execute(
        select(Project)
        .options(selectinload(Project.user))
        .where(Project.id == project.id)
    )
    return result.scalar_one()
 
 
async def update_project(
        db: AsyncSession,
        project: Project,
        payload: UpdateProjectRequest,
) -> Project:
    update_data = payload.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(project, field, value)
    await db.flush()
 
    result = await db.execute(
        select(Project)
        .options(selectinload(Project.user))
        .where(Project.id == project.id)
    )
    return result.scalar_one()