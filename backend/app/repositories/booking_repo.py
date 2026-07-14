from datetime import date, time
from typing import Optional, Sequence
from sqlalchemy import select

from app.models.booking import Booking
from app.repositories.base import BaseRepository


class BookingRepository(BaseRepository):
    async def get_by_id(self, booking_id: str) -> Optional[Booking]:
        result = await self.db.execute(select(Booking).where(Booking.id == booking_id))
        return result.scalar_one_or_none()

    async def get_bookings_for_appointment(
        self,
        appointment_type_id: str,
        start_date: date,
        end_date: date,
    ) -> Sequence[Booking]:
        result = await self.db.execute(
            select(Booking)
            .where(Booking.appointment_type_id == appointment_type_id)
            .where(Booking.date >= start_date)
            .where(Booking.date <= end_date)
        )
        return result.scalars().all()

    async def check_collision(
        self,
        appointment_type_id: str,
        booking_date: date,
        booking_time: time,
    ) -> bool:
        result = await self.db.execute(
            select(Booking)
            .where(Booking.appointment_type_id == appointment_type_id)
            .where(Booking.date == booking_date)
            .where(Booking.time == booking_time)
        )
        return result.scalar_one_or_none() is not None

    async def create(
        self,
        appointment_type_id: str,
        booking_date: date,
        day_of_week: str,
        booking_time: time,
        user_id: int,
    ) -> Booking:
        booking = Booking(
            appointment_type_id=appointment_type_id,
            date=booking_date,
            day_of_week=day_of_week,
            time=booking_time,
            user_id=user_id,
        )
        self.db.add(booking)
        await self.db.commit()
        await self.db.refresh(booking)
        return booking
