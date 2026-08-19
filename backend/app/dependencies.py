import uuid

from fastapi import Header, HTTPException, status
from jwt import InvalidTokenError

from app.db.base import SessionLocal
from app.db.models import User
from app.security import decode_access_token


def get_current_user(authorization: str | None = Header(default=None)) -> User:
    if authorization is None:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Not authenticated")

    scheme, _, token = authorization.partition(" ")
    if scheme.lower() != "bearer" or not token:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Not authenticated")

    try:
        user_id = uuid.UUID(decode_access_token(token))
    except (InvalidTokenError, ValueError):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Not authenticated")

    with SessionLocal() as session:
        user = session.get(User, user_id)

    if user is None:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Not authenticated")

    return user
