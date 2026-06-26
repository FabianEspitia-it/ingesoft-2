import uvicorn

from src.api.router import app

app.title = "UN Silicon Valley API"
app.version = "1.0.0"
app.description = "UN Silicon Valley API"
app.contact = {
    "name": "UN Silicon Valley Team",
}

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=9999)