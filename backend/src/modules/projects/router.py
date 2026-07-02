from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from src.api.dependencies import get_current_user
from src.infrastructure.db.database import get_db
from src.infrastructure.db.models import User
from src.modules.projects import crud
from src.modules.projects.schemas import (
    CreateProjectRequest,
    ProjectListResponse,
    ProjectResponse,
    UpdateProjectRequest,
)

projects_router = APIRouter(prefix="/projects", tags=["Projects"])

@projects_router.get("", response_model=ProjectListResponse)
async def list_projects(
    page: int = 1,
    page_size: int = 20,
    user_id: int | None = None,
    db: AsyncSession = Depends(get_db),
):
    items, total = await crud.list_projects(
        db, page=page, page_size=page_size, user_id=user_id
    )
    return ProjectListResponse(
        items=items,
        total=total,
        page=page,
        page_size=page_size,
    )

@projects_router.get("/{project_id}", response_model=ProjectResponse)
async def get_project(
    project_id: int,
    db: AsyncSession = Depends(get_db),
):
    project = await crud.get_project_by_id(db, project_id)
    if project is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Proyecto no encontrado.",
        )
    return project

@projects_router.post("", response_model=ProjectResponse, status_code=status.HTTP_201_CREATED)
async def create_project(
    payload: CreateProjectRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return await crud.create_project(db, user=current_user, payload=payload)

@projects_router.put("/{project_id}", response_model=ProjectResponse)
async def update_project(
    project_id: int,
    payload: UpdateProjectRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    project = await crud.get_project_by_id(db, project_id)
    if project is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Proyecto no encontrado.",
        )
    if project.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="No tienes permiso para editar este proyecto.",
        )
    return await crud.update_project(db, project=project, payload=payload)

@projects_router.delete("/{project_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_project(
    project_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    project = await crud.get_project_by_id(db, project_id)
    if project is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Proyecto no encontrado.",
        )
    if project.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="No tienes permiso para eliminar este proyecto.",
        )
    await db.delete(project)
    await db.flush()