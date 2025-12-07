from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from backend.config import get_settings
from backend.database import connect_to_mongo, close_mongo_connection
from backend.routes import auth, resumes, playlists, pods

settings = get_settings()

@asynccontextmanager
async def lifespan(app: FastAPI):
    await connect_to_mongo()
    yield
    await close_mongo_connection()

app = FastAPI(lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router, prefix="/api/v1/auth", tags=["auth"])
app.include_router(resumes.router, prefix="/api/v1/resumes", tags=["resumes"])
app.include_router(playlists.router, prefix="/api/v1/playlists", tags=["playlists"])
app.include_router(pods.router, prefix="/api/v1/pods", tags=["pods"])

@app.get("/healthz")
async def health_check():
    return {"status": "ok", "db": "connected"}

@app.get("/")
async def root():
    return {"message": "Welcome to CareerCircle API"}