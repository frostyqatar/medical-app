import os
import hashlib
import hmac
import time
import jwt
from functools import wraps
from fastapi import Request, HTTPException

ADMIN_USERNAME = os.environ.get("ADMIN_USERNAME", "admin")
ADMIN_PASSWORD = os.environ.get("ADMIN_PASSWORD", "cAr3Tr@ck3r!2026")
JWT_SECRET = os.environ.get("JWT_SECRET", hashlib.sha256(os.urandom(64)).hexdigest()[:64])
JWT_EXPIRY_HOURS = 24


def verify_password(password: str) -> bool:
    return hmac.compare_digest(password, ADMIN_PASSWORD)


def create_token(username: str) -> str:
    payload = {
        "sub": username,
        "iat": int(time.time()),
        "exp": int(time.time()) + JWT_EXPIRY_HOURS * 3600,
    }
    return jwt.encode(payload, JWT_SECRET, algorithm="HS256")


def verify_token(token: str) -> dict | None:
    try:
        return jwt.decode(token, JWT_SECRET, algorithms=["HS256"])
    except jwt.ExpiredSignatureError:
        return None
    except jwt.InvalidTokenError:
        return None


def require_auth(func):
    @wraps(func)
    async def wrapper(request: Request, *args, **kwargs):
        auth = request.headers.get("Authorization", "")
        if not auth.startswith("Bearer "):
            raise HTTPException(status_code=401, detail="Missing or invalid token")
        token = auth.split(" ", 1)[1]
        payload = verify_token(token)
        if payload is None:
            raise HTTPException(status_code=401, detail="Token expired or invalid")
        return await func(request, *args, **kwargs)
    return wrapper
