from fastapi import APIRouter

root_router = APIRouter()


@root_router.get("/health", tags=["Root"])
async def health_check():
    return {"status": "ok"}
