from app.dto.base import CamelModel


class GuestDTO(CamelModel):
    id: int
    phone: str
    first_name: str
    last_name: str
