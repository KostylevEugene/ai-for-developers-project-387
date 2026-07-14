from datetime import date, datetime, timedelta, time
from fastapi import HTTPException, status

from app.dto import CreateBookingRequestDTO
from app.models.booking import Booking
from app.repositories.appointment_repo import AppointmentTypeRepository
from app.repositories.booking_repo import BookingRepository
from app.repositories.guest_repo import GuestRepository


class BookingService:
    def __init__(
        self,
        booking_repo: BookingRepository,
        guest_repo: GuestRepository,
        appointment_repo: AppointmentTypeRepository,
    ):
        self.booking_repo = booking_repo
        self.guest_repo = guest_repo
        self.appointment_repo = appointment_repo

    async def create_booking(self, dto: CreateBookingRequestDTO) -> Booking:
        # 1. Проверяем тип записи
        appointment_type = await self.appointment_repo.get_by_id(dto.appointment_type_id)
        if not appointment_type:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Тип записи не найден",
            )

        # 2. Проверяем лимиты по дате (в пределах ближайших 14 дней)
        today = date.today()
        max_date = today + timedelta(days=13)
        if dto.date < today or dto.date > max_date:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Запись возможна только на ближайшие 14 дней",
            )

        # Если запись на сегодня, проверяем, что время не в прошлом
        if dto.date == today:
            now_time = datetime.now().time()
            if dto.time < now_time:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Нельзя забронировать время в прошлом",
                )

        # 3. Проверяем день недели
        day_name = dto.date.strftime("%A")
        if dto.day_of_week.value.lower() != day_name.lower():
            # На всякий случай замапим по индексу дня, чтобы не зависеть от локали
            days_map = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]
            expected_day = days_map[dto.date.weekday()]
            if dto.day_of_week.value.lower() != expected_day.lower():
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Указанный день недели {dto.day_of_week} не соответствует дате {dto.date}",
                )

        # 4. Проверяем, что время попадает в диапазон работы типа встречи и является валидным слотом
        start_time_of_day = appointment_type.start_time.time()
        end_time_of_day = appointment_type.end_time.time()
        duration_minutes = appointment_type.slot_duration_minutes

        # Проверка диапазона
        if dto.time < start_time_of_day or dto.time >= end_time_of_day:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Указанное время находится вне рабочих часов услуги",
            )

        # Проверка кратности слота от времени начала рабочего дня
        dummy_start = datetime.combine(dto.date, start_time_of_day)
        dummy_target = datetime.combine(dto.date, dto.time)
        diff_minutes = int((dummy_target - dummy_start).total_seconds() / 60)

        if diff_minutes % duration_minutes != 0:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Выбранное время не совпадает с началом доступного слота",
            )

        # 5. Проверяем коллизии (занято ли это время)
        is_collision = await self.booking_repo.check_collision(
            appointment_type_id=dto.appointment_type_id,
            booking_date=dto.date,
            booking_time=dto.time,
        )
        if is_collision:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Этот слот времени уже забронирован",
            )

        # 6. Поиск или создание гостя
        guest = await self.guest_repo.get_by_phone(dto.phone)
        if guest:
            # Обновим имя и фамилию, если они изменились
            if guest.first_name != dto.first_name or guest.last_name != dto.last_name:
                guest.first_name = dto.first_name
                guest.last_name = dto.last_name
                await self.guest_repo.db.commit()
                await self.guest_repo.db.refresh(guest)
        else:
            guest = await self.guest_repo.create(
                phone=dto.phone,
                first_name=dto.first_name,
                last_name=dto.last_name,
            )

        # 7. Создаем бронирование
        booking = await self.booking_repo.create(
            appointment_type_id=dto.appointment_type_id,
            booking_date=dto.date,
            day_of_week=dto.day_of_week.value,
            booking_time=dto.time,
            user_id=guest.id,
        )

        return booking
