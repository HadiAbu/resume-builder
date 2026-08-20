import base64
from dataclasses import dataclass

import httpx

from app.config import settings

GITHUB_API = "https://api.github.com"
MAX_REPOS = 15
MAX_LANGUAGES = 5
MAX_README_CHARS = 3000


class GitHubNotFoundError(Exception):
    """A GitHub API resource returned 404."""


class GitHubRateLimitedError(Exception):
    """GitHub's rate limit was hit (403/429)."""


class GitHubUnavailableError(Exception):
    """GitHub was unreachable or returned an unexpected error."""


@dataclass
class RepoData:
    github_repo: str
    title: str
    description: str
    homepage_url: str | None
    languages: list[str]
    topics: list[str]
    readme_excerpt: str | None


def _headers() -> dict[str, str]:
    headers = {"Accept": "application/vnd.github+json"}
    if settings.github_token:
        headers["Authorization"] = f"Bearer {settings.github_token}"
    return headers


def _request(client: httpx.Client, url: str) -> httpx.Response:
    try:
        response = client.get(url, headers=_headers(), timeout=10.0)
    except httpx.RequestError as exc:
        raise GitHubUnavailableError(str(exc)) from exc

    if response.status_code == 404:
        raise GitHubNotFoundError(url)
    if response.status_code in (403, 429):
        raise GitHubRateLimitedError(url)
    if response.status_code >= 400:
        raise GitHubUnavailableError(f"{response.status_code} from {url}")

    return response


def _fetch_languages(client: httpx.Client, full_name: str) -> list[str]:
    response = _request(client, f"{GITHUB_API}/repos/{full_name}/languages")
    data: dict[str, int] = response.json()
    ranked = sorted(data.items(), key=lambda item: item[1], reverse=True)
    return [name for name, _ in ranked[:MAX_LANGUAGES]]


def _fetch_readme_excerpt(client: httpx.Client, full_name: str) -> str | None:
    try:
        response = _request(client, f"{GITHUB_API}/repos/{full_name}/readme")
    except GitHubNotFoundError:
        return None

    data = response.json()
    content = base64.b64decode(data.get("content", "")).decode("utf-8", errors="replace")
    return content[:MAX_README_CHARS] or None


def fetch_github_repos(username: str) -> list[RepoData]:
    with httpx.Client() as client:
        response = _request(
            client,
            f"{GITHUB_API}/users/{username}/repos"
            f"?sort=pushed&direction=desc&per_page={MAX_REPOS}",
        )
        repos = response.json()[:MAX_REPOS]

        results: list[RepoData] = []
        for repo in repos:
            full_name = repo["full_name"]
            results.append(
                RepoData(
                    github_repo=full_name,
                    title=repo["name"],
                    description=repo.get("description") or "",
                    homepage_url=repo.get("homepage") or None,
                    languages=_fetch_languages(client, full_name),
                    topics=repo.get("topics") or [],
                    readme_excerpt=_fetch_readme_excerpt(client, full_name),
                )
            )

        return results
