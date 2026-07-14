from datetime import date, datetime, timedelta, time
from typing import Optional, Sequence

from app.dto import AppointmentTypeCreateDTO, AppointmentTypeUpdateDTO, DayOfWeek, SlotDTO
from app.models.appointment_type import AppointmentType
from app.repositories.appointment_repo import AppointmentTypeRepository
from app.repositories.booking_repo import BookingRepository


class AppointmentTypeService:
    def __init__(
        self,
        appointment_repo: AppointmentTypeRepository,
        booking_repo: BookingRepository,
    ):
        self.appointment_repo = appointment_repo
        self.booking_repo = booking_repo

    async def get_all(self) -> Sequence[AppointmentType]:
        return await self.appointment_repo.get_all()

    async def get_by_id(self, appointment_id: str) -> Optional[AppointmentType]:
        return await self.appointment_repo.get_by_id(appointment_id)

    async def create(self, dto: AppointmentTypeCreateDTO) -> AppointmentType:
        return await self.appointment_repo.create(
            name=dto.name,
            start_time=dto.start_time,
            end_time=dto.end_time,
            slot_duration_minutes=dto.slot_duration_minutes,
        )

    async def update(
        self, appointment_id: str, dto: AppointmentTypeUpdateDTO
    ) -> Optional[AppointmentType]:
        appointment_type = await self.appointment_repo.get_by_id(appointment_id)
        if not appointment_type:
            return None
        return await self.appointment_repo.update(
            appointment_type=appointment_type,
            name=dto.name,
            start_time=dto.start_time,
            end_time=dto.end_time,
            slot_duration_minutes=dto.slot_duration_minutes,
        )

    async def delete(self, appointment_id: str) -> bool:
        appointment_type = await self.appointment_repo.get_by_id(appointment_id)
        if not appointment_type:
            return False
        await self.appointment_repo.delete(appointment_type)
        return True

    async def generate_slots_for_14_days(self, appointment_type: AppointmentType) -> list[SlotDTO]:
        """
        Динамическая генерация сетки слотов на ближайшие 14 дней (включая сегодняшний)
        """
        slots = []
        today = date.today()
        end_date = today + timedelta(days=13)

        # Получаем существующие бронирования за этот период
        bookings = await self.booking_repo.get_bookings_for_appointment(
            appointment_type_id=appointment_type.id,
            start_date=today,
            end_date=end_date,
        )

        # Организуем существующие бронирования в set для быстрого поиска: (дата, время)
        reserved_slots = {(b.date, b.time) for b in bookings}

        # Извлекаем время начала и окончания из UTC DateTime полей
        start_time_of_day = appointment_type.start_time.time()
        end_time_of_day = appointment_type.end_time.time()
        duration_minutes = appointment_type.slot_duration_minutes

        # Генерация для каждого из 14 дней
        for i in range(14):
            current_date = today + timedelta(days=i)
            # В Python strftime("%A") возвращает 'Monday', 'Tuesday' и т.д.
            day_name = current_date.strftime("%A")
            try:
                day_of_week = DayOfWeek(day_name)
            except ValueError:
                # На всякий случай, если локаль вернет на другом языке, замапим индекс дня
                # 0 - Monday, 6 - Sunday
                days_map = [
                    DayOfWeek.Monday, DayOfWeek.Tuesday, DayOfWeek.Wednesday,
                    DayOfWeek.Thursday, DayOfWeek.Friday, DayOfWeek.Saturday, DayOfWeek.Sunday
                ]
                day_of_week = days_map[current_date.weekday()]

            # Генерируем временные слоты для текущего дня
            current_time = start_time_of_day
            while True:
                # Проверим, что текущий слот не выходит за границы end_time_of_day
                # Для этого сложим current_time и duration_minutes
                dummy_dt = datetime.combine(current_date, current_time)
                next_dummy_dt = dummy_dt + timedelta(minutes=duration_minutes)
                
                # Если следующий слот выходит за рамки конца рабочего дня, останавливаемся
                # При сравнении времени важно учесть, переходит ли за полночь. 
                # Предполагаем, что рабочий день в пределах одних суток: start_time < end_time
                if next_dummy_dt.time() > end_time_of_day or next_dummy_dt.date() > current_date:
                    break

                # Проверяем, забронирован ли этот слот
                is_reserved = (current_date, current_time) in reserved_slots

                # Если это сегодняшний день, то прошедшие слоты времени должны помечаться как забронированные (или недоступные)
                # По спецификации: "с ограничением прошлых и слишком далеких дат"
                if current_date == today:
                    now_time = datetime.now().time()
                    if current_time < now_time:
                        is_reserved = True

                slots.append(
                    SlotDTO(
                        date=current_date,
                        day_of_week=day_of_week,
                        time=current_time,
                        reserved=is_reserved,
                    )
                )

                # Шаг к следующему слоту
                current_time = next_dummy_dt.time()
                # Если мы случайно вернулись в полночь, прерываемся
                if current_time == time(0, 0) and next_dummy_dt.date() > current_date:
                    break

        return slots
