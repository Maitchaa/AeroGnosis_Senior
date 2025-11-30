"""Entry point for running the FastAPI backend with Uvicorn."""

import uvicorn


if __name__ == "__main__":
    uvicorn.run("app:app", host="0.0.0.0", port=8000, reload=True)
