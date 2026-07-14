from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.dto import (
    AppointmentTypeCreateDTO,
    AppointmentTypeDTO,
    AppointmentTypeUpdateDTO,
)
from app.repositories import AppointmentTypeRepository, BookingRepository
from app.services import AppointmentTypeService

router = APIRouter(prefix="/appointment-types", tags=["Appointment Types"])


def get_appointment_service(db: AsyncSession = Depends(get_db)) -> AppointmentTypeService:
    appointment_repo = AppointmentTypeRepository(db)
    booking_repo = BookingRepository(db)
    return AppointmentTypeService(appointment_repo, booking_repo)


@router.get(
    "",
    response_model=list[AppointmentTypeDTO],
    summary="Список типов записей"
)
async def list_appointment_types(
    service: AppointmentTypeService = Depends(get_appointment_service)
):
    items = await service.get_all()
    # Конвертируем SQLAlchemy объекты в DTO без генерации слотов
    return [AppointmentTypeDTO.model_validate(item) for item in items]


@router.get(
    "/{id}",
    response_model=AppointmentTypeDTO,
    summary="Детальная информация о типе записи со всей сеткой слотов на 14 дней"
)
async def read_appointment_type(
    id: str,
    service: AppointmentTypeService = Depends(get_appointment_service)
):
    appointment_type = await service.get_by_id(id)
    if not appointment_type:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Тип записи не найден"
        )
    
    # Генерируем слоты
    slots = await service.generate_slots_for_14_days(appointment_type)
    
    # Создаем DTO и прикрепляем слоты
    dto = AppointmentTypeDTO.model_validate(appointment_type)
    dto.slots = slots
    return dto


@router.post(
    "",
    response_model=AppointmentTypeDTO,
    summary="Создать новый тип записи"
)
async def create_appointment_type(
    body: AppointmentTypeCreateDTO,
    service: AppointmentTypeService = Depends(get_appointment_service)
):
    item = await service.create(body)
    return AppointmentTypeDTO.model_validate(item)


@router.patch(
    "/{id}",
    response_model=AppointmentTypeDTO,
    summary="Редактировать тип записи"
)
async def update_appointment_type(
    id: str,
    body: AppointmentTypeUpdateDTO,
    service: AppointmentTypeService = Depends(get_appointment_service)
):
    item = await service.update(id, body)
    if not item:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Тип записи не найден"
        )
    return AppointmentTypeDTO.model_validate(item)


@router.delete(
    "/{id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Удалить тип записи"
)
async def delete_appointment_type(
    id: str,
    service: AppointmentTypeService = Depends(get_appointment_service)
):
    success = await service.delete(id)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Тип записи не найден"
        )
