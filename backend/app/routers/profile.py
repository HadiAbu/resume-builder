from fastapi import APIRouter, Depends, HTTPException, status

from app.db.base import SessionLocal
from app.db.models import User
from app.dependencies import get_current_user
from app.schemas import ProfileOut, ProfileUpdateRequest

router = APIRouter(prefix="/profile", tags=["profile"])


def _to_profile_out(user: User) -> ProfileOut:
    return ProfileOut(
        id=str(user.id),
        email=user.email,
        display_name=user.display_name,
        bio=user.bio,
        photo_url=user.photo_url,
        role=user.role,
        github_url=user.github_url,
        linkedin_url=user.linkedin_url,
        skills=user.skills,
    )


@router.get("", response_model=ProfileOut)
def get_profile() -> ProfileOut:
    with SessionLocal() as session:
        user = session.query(User).first()

    if user is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Profile not found")

    return _to_profile_out(user)


@router.patch("", response_model=ProfileOut)
def update_profile(
    payload: ProfileUpdateRequest,
    current_user: User = Depends(get_current_user),
) -> ProfileOut:
    with SessionLocal() as session:
        user = session.get(User, current_user.id)
        if user is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Profile not found")

        user.display_name = payload.display_name
        user.bio = payload.bio
        user.role = payload.role
        user.github_url = payload.github_url
        user.linkedin_url = payload.linkedin_url
        user.skills = payload.skills
        if payload.photo_url is not None:
            user.photo_url = payload.photo_url

        session.commit()
        session.refresh(user)

        return _to_profile_out(user)
