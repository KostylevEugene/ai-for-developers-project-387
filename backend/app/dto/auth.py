from app.dto.base import CamelModel


class LoginRequestDTO(CamelModel):
    password: str
