from fastapi import HTTPException, status

from app.config import settings


class AuthService:
    def verify_password(self, password: str) -> None:
        if password != settings.ADMIN_PASSWORD:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Неверный пароль администратора"
            )
