from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.sql import func

from app.db.base import SessionLocal
from app.db.models import Project, User
from app.dependencies import get_current_user
from app.github import (
    GitHubNotFoundError,
    GitHubRateLimitedError,
    GitHubUnavailableError,
    fetch_github_repos,
)
from app.schemas import ImportRequest, ImportResponse, ProjectOut

router = APIRouter(prefix="/projects", tags=["projects"])


@router.get("", response_model=list[ProjectOut])
def list_projects() -> list[ProjectOut]:
    with SessionLocal() as session:
        user = session.query(User).first()
        if user is None:
            return []

        projects = session.execute(
            select(Project).where(Project.user_id == user.id)
        ).scalars().all()

        return [
            ProjectOut(
                id=str(project.id),
                title=project.title,
                description=project.description,
                homepage_url=project.homepage_url,
                github_repo=project.github_repo,
                languages=project.languages,
                topics=project.topics,
                tech_keywords=project.tech_keywords,
                purpose_keywords=project.purpose_keywords,
            )
            for project in projects
        ]


@router.post("/import", response_model=ImportResponse)
def import_projects(
    payload: ImportRequest,
    current_user: User = Depends(get_current_user),
) -> ImportResponse:
    try:
        repos = fetch_github_repos(payload.github_username)
    except GitHubNotFoundError:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="GitHub user not found")
    except GitHubRateLimitedError:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="GitHub rate limit exceeded. Try again later.",
        )
    except GitHubUnavailableError:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="Could not reach GitHub. Try again later.",
        )

    with SessionLocal() as session:
        for repo in repos:
            existing = session.execute(
                select(Project).where(
                    Project.user_id == current_user.id,
                    Project.github_repo == repo.github_repo,
                )
            ).scalar_one_or_none()

            if existing is None:
                session.add(
                    Project(
                        user_id=current_user.id,
                        github_repo=repo.github_repo,
                        title=repo.title,
                        description=repo.description,
                        homepage_url=repo.homepage_url,
                        languages=repo.languages,
                        topics=repo.topics,
                        readme_excerpt=repo.readme_excerpt,
                        imported_at=func.now(),
                    )
                )
            else:
                existing.title = repo.title
                existing.description = repo.description
                existing.homepage_url = repo.homepage_url
                existing.languages = repo.languages
                existing.topics = repo.topics
                existing.readme_excerpt = repo.readme_excerpt
                existing.imported_at = func.now()
                # tech_keywords/purpose_keywords are deliberately untouched -
                # they're AI-generated (feature 6) and must survive a re-import.

        session.commit()

    return ImportResponse(imported_count=len(repos))
