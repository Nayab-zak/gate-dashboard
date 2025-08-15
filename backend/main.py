# server/app/main.py
from fastapi import FastAPI
from .routers import forecast, meta, capacity, analytics
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(title="Gate Tokens Forecast API", version="1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:3001", "http://127.0.0.1:3000", "http://127.0.0.1:3001", "*"],  # tighten later
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(forecast.router)
app.include_router(meta.router)
app.include_router(capacity.router)
app.include_router(analytics.router)

@app.get("/")
async def root():
    return {"status": "ok"}
# server/app/main.py
# This is the main entry point for the FastAPI application.
# It includes routers for forecast, meta, and capacity endpoints.
# The root endpoint returns a simple status message.
