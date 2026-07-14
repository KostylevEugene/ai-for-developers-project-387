from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.dto import BookingDTO, CreateBookingRequestDTO
from app.repositories import AppointmentTypeRepository, BookingRepository, GuestRepository
from app.services import BookingService

router = APIRouter(prefix="/booking", tags=["Bookings"])


def get_booking_service(db: AsyncSession = Depends(get_db)) -> BookingService:
    booking_repo = BookingRepository(db)
    guest_repo = GuestRepository(db)
    appointment_repo = AppointmentTypeRepository(db)
    return BookingService(booking_repo, guest_repo, appointment_repo)


@router.post(
    "",
    response_model=BookingDTO,
    summary="Создать запись на выбранный слот"
)
async def create_booking(
    body: CreateBookingRequestDTO,
    booking_service: BookingService = Depends(get_booking_service),
):
    booking = await booking_service.create_booking(body)
    return booking
