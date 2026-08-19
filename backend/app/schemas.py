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
