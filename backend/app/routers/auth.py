from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select

from app.db.base import SessionLocal
from app.db.models import User
from app.dependencies import get_current_user
from app.schemas import AuthResponse, LoginRequest, SetupStatusResponse, SignupRequest, UserOut
from app.security import create_access_token, hash_password, verify_password

router = APIRouter(prefix="/auth", tags=["auth"])


@router.get("/me", response_model=UserOut)
def me(current_user: User = Depends(get_current_user)) -> UserOut:
    return UserOut(id=str(current_user.id), email=current_user.email, display_name=current_user.display_name)


@router.get("/setup-status", response_model=SetupStatusResponse)
def setup_status() -> SetupStatusResponse:
    with SessionLocal() as session:
        owner_exists = session.execute(select(User.id).limit(1)).first() is not None
    return SetupStatusResponse(needs_setup=not owner_exists)


@router.post("/signup", response_model=AuthResponse)
def signup(payload: SignupRequest) -> AuthResponse:
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

        return AuthResponse(
            token=token,
            user=UserOut(id=str(user.id), email=user.email, display_name=user.display_name),
        )


@router.post("/login", response_model=AuthResponse)
def login(payload: LoginRequest) -> AuthResponse:
    invalid_credentials = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Invalid email or password",
    )

    with SessionLocal() as session:
        user = session.execute(select(User).where(User.email == payload.email)).scalar_one_or_none()

        if user is None or not verify_password(payload.password, user.password_hash):
            raise invalid_credentials

        token = create_access_token(str(user.id))

        return AuthResponse(
            token=token,
            user=UserOut(id=str(user.id), email=user.email, display_name=user.display_name),
        )
