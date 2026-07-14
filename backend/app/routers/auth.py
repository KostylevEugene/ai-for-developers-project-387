from fastapi import APIRouter, Depends, status

from app.dto import LoginRequestDTO
from app.services import AuthService

router = APIRouter(prefix="/auth", tags=["Authentication"])


def get_auth_service() -> AuthService:
    return AuthService()


@router.post(
    "/login",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Проверить пароль администратора"
)
async def login(
    body: LoginRequestDTO,
    auth_service: AuthService = Depends(get_auth_service)
):
    auth_service.verify_password(body.password)
