import uvicorn
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from src.routers import auth, users, roles
from src.database import seed_data

app = FastAPI(
    title="Rebuild Mock API",
    description="Mock API server for Rebuild application development",
    version="0.1.0",
)

# CORS middleware for frontend development
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, specify actual origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["X-Total-Count"],
)

# Include routers
app.include_router(auth.router)
app.include_router(users.router)
app.include_router(roles.router)


@app.on_event("startup")
async def startup_event():
    """Initialize mock data on startup."""
    seed_data()


@app.get("/")
async def root():
    """Health check endpoint."""
    return {
        "status": "ok",
        "message": "Rebuild Mock API is running",
        "docs": "/docs",
    }


@app.get("/health")
async def health():
    """Health check for container orchestration."""
    return {"status": "healthy"}


def run():
    """Run the server (for use with project.scripts)."""
    uvicorn.run(
        "src.main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
    )


if __name__ == "__main__":
    run()
