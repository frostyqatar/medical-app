"""Care Tracker — FastAPI server for Patient Care Tracking System."""
from fastapi import FastAPI, Request, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from .routes import patient, medications, vitals, glucose, labs, wounds, symptoms, appointments, actions, alerts_route, summary, export_data, chat, good_tracking, plans, auth_route
from .auth import verify_token

PUBLIC_PATHS = {"/api/auth/login", "/api/health", "/docs", "/openapi.json", "/favicon.ico"}

app = FastAPI(title="Care Tracker", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.middleware("http")
async def auth_middleware(request: Request, call_next):
    if request.method == "OPTIONS":
        return await call_next(request)
    path = request.url.path.rstrip("/")
    if path in PUBLIC_PATHS or path == "/api/auth/login":
        return await call_next(request)
    if path.startswith("/api/"):
        auth = request.headers.get("Authorization", "")
        if not auth.startswith("Bearer "):
            return JSONResponse(status_code=401, content={"detail": "Missing or invalid token"})
        token = auth.split(" ", 1)[1]
        payload = verify_token(token)
        if payload is None:
            return JSONResponse(status_code=401, content={"detail": "Token expired or invalid"})
    return await call_next(request)


app.include_router(auth_route.router)
app.include_router(patient.router)
app.include_router(medications.router)
app.include_router(vitals.router)
app.include_router(glucose.router)
app.include_router(labs.router)
app.include_router(wounds.router)
app.include_router(symptoms.router)
app.include_router(appointments.router)
app.include_router(actions.router)
app.include_router(alerts_route.router)
app.include_router(summary.router)
app.include_router(export_data.router)
app.include_router(chat.router)
app.include_router(good_tracking.router)
app.include_router(plans.router)


@app.get("/api/health")
def health():
    return {"status": "ok"}
