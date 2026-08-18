from fastapi import APIRouter, HTTPException, status
from sqlalchemy import select

from app.db.base import SessionLocal
from app.db.models import User
from app.schemas import SetupStatusResponse, SignupRequest, SignupResponse, UserOut
from app.security import create_access_token, hash_password

router = APIRouter(prefix="/auth", tags=["auth"])


@router.get("/setup-status", response_model=SetupStatusResponse)
def setup_status() -> SetupStatusResponse:
    with SessionLocal() as session:
        owner_exists = session.execute(select(User.id).limit(1)).first() is not None
    return SetupStatusResponse(needs_setup=not owner_exists)


@router.post("/signup", response_model=SignupResponse)
def signup(payload: SignupRequest) -> SignupResponse:
    with SessionLocal() as session:
        owner_exists = session.execute(select(User.id).limit(1)).first() is not None
        if owner_exists:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Owner account already exists",
            )

        user = User(
            email=payload.email,
            password_hash=hash_password(payload.password),
            display_name=payload.display_name,
        )
        session.add(user)
        session.commit()
        session.refresh(user)

        token = create_access_token(str(user.id))

        return SignupResponse(
            token=token,
            user=UserOut(id=str(user.id), email=user.email, display_name=user.display_name),
        )
