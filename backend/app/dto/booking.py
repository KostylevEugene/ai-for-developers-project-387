from datetime import date, time

from app.dto.base import CamelModel
from app.dto.common import DayOfWeek


class BookingDTO(CamelModel):
    id: str
    date: date
    day_of_week: DayOfWeek
    time: time
    user_id: int
    appointment_type_id: str


class CreateBookingRequestDTO(CamelModel):
    appointment_type_id: str
    date: date
    day_of_week: DayOfWeek
    time: time
    phone: str
    first_name: str
    last_name: str
