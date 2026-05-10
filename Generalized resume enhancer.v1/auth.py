import os
import secrets
from fastapi import Security, HTTPException, status
from fastapi.security import APIKeyHeader

API_KEY_HEADER = APIKeyHeader(name="X-API-Key", auto_error=False)


def get_api_key(api_key: str = Security(API_KEY_HEADER)) -> str:
    
    expected = os.environ.get("API_KEY", "")

    if not expected:
        raise RuntimeError("API_KEY ")

    if not api_key:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing API key. Pass it as: X-API-Key: <your-key>",
        )

    # Constant-time comparison to prevent timing attacks
    if not secrets.compare_digest(api_key.strip(), expected.strip()):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Invalid API key.",
        )

    return api_key