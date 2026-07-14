from datetime import date, datetime, time
from typing import Optional

from app.dto.base import CamelModel
from app.dto.common import DayOfWeek


class SlotDTO(CamelModel):
    date: date
    day_of_week: DayOfWeek
    time: time
    reserved: bool


class AppointmentTypeDTO(CamelModel):
    id: str
    name: str
    start_time: datetime
    end_time: datetime
    slot_duration_minutes: int
    slots: Optional[list[SlotDTO]] = None


class AppointmentTypeCreateDTO(CamelModel):
    name: str
    start_time: datetime
    end_time: datetime
    slot_duration_minutes: int


class AppointmentTypeUpdateDTO(CamelModel):
    name: Optional[str] = None
    start_time: Optional[datetime] = None
    end_time: Optional[datetime] = None
    slot_duration_minutes: Optional[int] = None
