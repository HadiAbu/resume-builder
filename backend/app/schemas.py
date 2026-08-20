from pydantic import BaseModel, ConfigDict, EmailStr, Field
from pydantic.alias_generators import to_camel


class CamelModel(BaseModel):
    model_config = ConfigDict(alias_generator=to_camel, populate_by_name=True)


class SignupRequest(CamelModel):
    email: EmailStr
    password: str = Field(min_length=8)
    display_name: str


class LoginRequest(CamelModel):
    email: EmailStr
    password: str


class UserOut(CamelModel):
    id: str
    email: str
    display_name: str


class AuthResponse(CamelModel):
    token: str
    user: UserOut


class SetupStatusResponse(CamelModel):
    needs_setup: bool


class ProfileOut(CamelModel):
    id: str
    email: str
    display_name: str
    bio: str | None
    photo_url: str | None
    role: str | None
    github_url: str | None
    linkedin_url: str | None
    skills: list[str]


class ProfileUpdateRequest(CamelModel):
    display_name: str = Field(min_length=1)
    bio: str | None = None
    role: str | None = None
    github_url: str | None = None
    linkedin_url: str | None = None
    skills: list[str] = Field(default_factory=list)
    photo_url: str | None = Field(default=None, max_length=2_800_000)


class ProjectOut(CamelModel):
    id: str
    title: str
    description: str
    homepage_url: str | None
    github_repo: str
    languages: list[str]
    topics: list[str]
    tech_keywords: list[str]
    purpose_keywords: list[str]


class ImportRequest(CamelModel):
    github_username: str = Field(min_length=1)


class ImportResponse(CamelModel):
    imported_count: int
