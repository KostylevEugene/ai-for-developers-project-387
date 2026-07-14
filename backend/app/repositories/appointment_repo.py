from datetime import datetime
from typing import Optional, Sequence
from sqlalchemy import select

from app.models.appointment_type import AppointmentType
from app.repositories.base import BaseRepository


class AppointmentTypeRepository(BaseRepository):
    async def get_all(self) -> Sequence[AppointmentType]:
        result = await self.db.execute(select(AppointmentType).order_by(AppointmentType.name))
        return result.scalars().all()

    async def get_by_id(self, appointment_id: str) -> Optional[AppointmentType]:
        result = await self.db.execute(
            select(AppointmentType).where(AppointmentType.id == appointment_id)
        )
        return result.scalar_one_or_none()

    async def create(
        self,
        name: str,
        start_time: datetime,
        end_time: datetime,
        slot_duration_minutes: int,
    ) -> AppointmentType:
        appointment_type = AppointmentType(
            name=name,
            start_time=start_time,
            end_time=end_time,
            slot_duration_minutes=slot_duration_minutes,
        )
        self.db.add(appointment_type)
        await self.db.commit()
        await self.db.refresh(appointment_type)
        return appointment_type

    async def update(
        self,
        appointment_type: AppointmentType,
        name: Optional[str] = None,
        start_time: Optional[datetime] = None,
        end_time: Optional[datetime] = None,
        slot_duration_minutes: Optional[int] = None,
    ) -> AppointmentType:
        if name is not None:
            appointment_type.name = name
        if start_time is not None:
            appointment_type.start_time = start_time
        if end_time is not None:
            appointment_type.end_time = end_time
        if slot_duration_minutes is not None:
            appointment_type.slot_duration_minutes = slot_duration_minutes

        await self.db.commit()
        await self.db.refresh(appointment_type)
        return appointment_type

    async def delete(self, appointment_type: AppointmentType) -> None:
        await self.db.delete(appointment_type)
        await self.db.commit()
