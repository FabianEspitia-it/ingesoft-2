"""Google Cloud Storage helper for uploading entry cover images.

The bucket is kept private: uploads store only the object path, and reads get a
short-lived V4 signed URL generated locally with the service-account private key.

Authenticates with the service-account credentials from settings when present
(works locally and on Cloud Run), otherwise falls back to Application Default
Credentials (the attached service account on Cloud Run). Note: signing needs the
service-account private key, so ADC without a key cannot generate signed URLs.
"""

from __future__ import annotations

import logging
import uuid
from datetime import timedelta
from functools import lru_cache

from google.cloud import storage
from google.oauth2 import service_account
from src.core.config import settings

logger = logging.getLogger(__name__)

# Extensions allowed for cover images (JPG/PNG only).
_EXTENSION_BY_CONTENT_TYPE = {
    "image/jpeg": "jpg",
    "image/png": "png",
}

# How long a cover-image signed URL stays valid. Entry pages are re-rendered on
# every request (frontend fetch is no-store), so a short lifetime is enough.
COVER_URL_EXPIRY = timedelta(hours=1)


class StorageNotConfiguredError(RuntimeError):
    """Raised when no GCS bucket is configured."""


@lru_cache(maxsize=1)
def _get_client() -> storage.Client:
    """Build a cached Storage client from settings or ADC."""
    email = settings.GCP_SERVICE_ACCOUNT_EMAIL
    private_key = settings.GCP_SERVICE_ACCOUNT_PRIVATE_KEY.replace("\\n", "\n")
    project = settings.PROJECT_NAME or None

    if email and private_key:
        credentials = service_account.Credentials.from_service_account_info(
            {
                "type": "service_account",
                "project_id": project or "",
                "client_email": email,
                "private_key": private_key,
                "token_uri": "https://oauth2.googleapis.com/token",
            }
        )
        return storage.Client(project=project, credentials=credentials)

    # No explicit credentials: rely on ADC (e.g. Cloud Run service account).
    return storage.Client(project=project)


def upload_cover_image(*, data: bytes, content_type: str) -> str:
    """Upload image bytes to the private bucket and return the object path.

    The caller is responsible for validating size and content type. The returned
    path (e.g. ``covers/<uuid>.jpg``) is what should be persisted on the entry.
    """
    bucket_name = settings.GCS_BUCKET_NAME
    if not bucket_name:
        raise StorageNotConfiguredError(
            "GCS_BUCKET_NAME no está configurado; no se puede subir la imagen."
        )

    extension = _EXTENSION_BY_CONTENT_TYPE.get(content_type, "bin")
    object_name = f"covers/{uuid.uuid4().hex}.{extension}"

    bucket = _get_client().bucket(bucket_name)
    blob = bucket.blob(object_name)
    blob.upload_from_string(data, content_type=content_type)

    return object_name


def _normalize_object_name(value: str) -> str:
    """Return the bare object path from a stored value.

    Tolerates values that were stored as a full storage URL (e.g. legacy entries
    saved before the bucket went private) as well as plain object paths.
    """
    bucket = settings.GCS_BUCKET_NAME
    for prefix in (
        f"https://storage.googleapis.com/{bucket}/",
        f"https://{bucket}.storage.googleapis.com/",
        f"gs://{bucket}/",
    ):
        if value.startswith(prefix):
            return value[len(prefix) :]
    return value


def signed_cover_url(value: str | None) -> str | None:
    """Return a short-lived signed GET URL for a stored cover-image path.

    Returns ``None`` (instead of raising) when storage is not configured or the
    URL cannot be signed, so reading an entry never fails because of an image.
    """
    if not value:
        return None
    bucket_name = settings.GCS_BUCKET_NAME
    if not bucket_name:
        return None

    try:
        object_name = _normalize_object_name(value)
        blob = _get_client().bucket(bucket_name).blob(object_name)
        return blob.generate_signed_url(
            version="v4",
            expiration=COVER_URL_EXPIRY,
            method="GET",
        )
    except Exception:  # noqa: BLE001 - image is optional; never break the read
        logger.exception("No se pudo firmar la URL de la portada: %s", value)
        return None
