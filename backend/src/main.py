from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
#from src.users.router import users_router


app = FastAPI()

app.title = "UN Silicon Valley API"
app.description = "API for the UN Silicon Valley"
app.version = "0.1.0"


app.add_middleware(
    CORSMiddleware,
    allow_origins=[
  "http://localhost:3000",
],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["Content-Disposition"],
)

@app.get("/ping")
async def ping():
    return {"message": "pong"}


#app.include_router(users_router, prefix="/users", tags=["Users"])
