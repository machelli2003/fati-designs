import re
from typing import Literal

from pydantic import BaseModel, EmailStr, Field, field_validator

from . import config

Status = Literal["draft", "published"]


class ImageRef(BaseModel):
    url: str = Field(max_length=1000)
    public_id: str | None = Field(default=None, max_length=300)


class DesignIn(BaseModel):
    title: str = Field(min_length=1, max_length=140)
    description: str = Field(default="", max_length=4000)
    category: str
    collection_id: str | None = None
    images: list[ImageRef] = Field(default_factory=list, max_length=30)
    featured: bool = False
    status: Status = "draft"

    @field_validator("category")
    @classmethod
    def _cat(cls, v: str):
        if v not in config.CATEGORIES:
            raise ValueError("Invalid category")
        return v


class CollectionIn(BaseModel):
    name: str = Field(min_length=1, max_length=140)
    description: str = Field(default="", max_length=2000)
    cover_url: str | None = Field(default=None, max_length=1000)
    cover_public_id: str | None = Field(default=None, max_length=300)
    status: Status = "published"


_EMBED = re.compile(
    r"^https?://(www\.)?(youtube\.com|youtu\.be|m\.youtube\.com|vimeo\.com|player\.vimeo\.com)/", re.I
)


class VideoIn(BaseModel):
    title: str = Field(min_length=1, max_length=140)
    description: str = Field(default="", max_length=3000)
    category: Literal["runway", "process"]
    source: Literal["upload", "embed"]
    video_url: str = Field(min_length=1, max_length=1000)
    video_public_id: str | None = Field(default=None, max_length=300)
    thumbnail_url: str | None = Field(default=None, max_length=1000)
    thumbnail_public_id: str | None = Field(default=None, max_length=300)
    status: Status = "draft"

    @field_validator("video_url")
    @classmethod
    def _url(cls, v: str):
        if not v.lower().startswith(("http://", "https://")):
            raise ValueError("Video URL must start with http(s)://")
        return v

    def model_post_init(self, __context):
        if self.source == "embed" and not _EMBED.match(self.video_url):
            raise ValueError("Only YouTube or Vimeo links are supported")


class InquiryIn(BaseModel):
    name: str = Field(min_length=2, max_length=120)
    contact: str = Field(min_length=3, max_length=160)
    service: str = Field(default="Other", max_length=80)
    message: str = Field(min_length=5, max_length=3000)
    website: str = Field(default="", max_length=200)  # honeypot - must stay empty

    @field_validator("contact")
    @classmethod
    def _contact(cls, v: str):
        v = v.strip()
        is_email = re.fullmatch(r"[^@\s]+@[^@\s]+\.[^@\s]+", v) is not None
        digits = re.sub(r"\D", "", v)
        if not is_email and not (7 <= len(digits) <= 15):
            raise ValueError("Enter a valid email address or phone number")
        return v


class InquiryStatus(BaseModel):
    status: Literal["new", "contacted", "completed"]


class SettingsIn(BaseModel):
    brand_name: str = Field(max_length=80)
    tagline: str = Field(default="", max_length=200)
    hero_heading: str = Field(default="", max_length=200)
    hero_description: str = Field(default="", max_length=1000)
    hero_image_url: str | None = Field(default=None, max_length=1000)
    about_heading: str = Field(default="", max_length=200)
    about_bio: str = Field(default="", max_length=8000)
    profile_image_url: str | None = Field(default=None, max_length=1000)
    whatsapp_number: str = Field(default="", max_length=30)
    instagram_url: str = Field(default="", max_length=300)
    email: str = Field(default="", max_length=160)
    phone: str = Field(default="", max_length=40)
    location: str = Field(default="", max_length=160)


class LoginIn(BaseModel):
    email: EmailStr
    password: str = Field(min_length=1, max_length=200)


class SignIn(BaseModel):
    resource_type: Literal["image", "video"]
    folder: Literal["designs", "videos", "thumbnails", "profile", "site"] = "designs"
