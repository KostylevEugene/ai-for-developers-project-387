import uuid
from datetime import date, time
from sqlalchemy import Date, ForeignKey, Integer, String, Time
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base


class Booking(Base):
    __tablename__ = "bookings"

    id: Mapped[str] = mapped_column(
        String(36),
        primary_key=True,
        default=lambda: str(uuid.uuid4()),
    )
    date: Mapped[date] = mapped_column(Date, nullable=False)
    day_of_week: Mapped[str] = mapped_column(String, nullable=False)
    time: Mapped[time] = mapped_column(Time, nullable=False)

    user_id: Mapped[int] = mapped_column(
        Integer,
        ForeignKey("guests.id", ondelete="CASCADE"),
        nullable=False,
    )
    appointment_type_id: Mapped[str] = mapped_column(
        String(36),
        ForeignKey("appointment_types.id", ondelete="CASCADE"),
        nullable=False,
    )

    guest: Mapped["Guest"] = relationship("Guest", back_populates="bookings")
    appointment_type: Mapped["AppointmentType"] = relationship(
        "AppointmentType",
        back_populates="bookings",
    )
