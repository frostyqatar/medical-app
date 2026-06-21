"""Auth endpoints for login."""
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from ..auth import verify_password, create_token, ADMIN_USERNAME

router = APIRouter(prefix="/api/auth", tags=["auth"])


class LoginRequest(BaseModel):
    username: str
    password: str


class LoginResponse(BaseModel):
    token: str
    username: str
    expires_in: int


@router.post("/login", response_model=LoginResponse)
def login(body: LoginRequest):
    if body.username != ADMIN_USERNAME:
        raise HTTPException(status_code=401, detail="Invalid credentials")
    if not verify_password(body.password):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    token = create_token(body.username)
    return LoginResponse(token=token, username=body.username, expires_in=86400)
