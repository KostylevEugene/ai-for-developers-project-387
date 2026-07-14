from typing import Optional
from sqlalchemy import select

from app.models.guest import Guest
from app.repositories.base import BaseRepository


class GuestRepository(BaseRepository):
    async def get_by_id(self, guest_id: int) -> Optional[Guest]:
        result = await self.db.execute(select(Guest).where(Guest.id == guest_id))
        return result.scalar_one_or_none()

    async def get_by_phone(self, phone: str) -> Optional[Guest]:
        result = await self.db.execute(select(Guest).where(Guest.phone == phone))
        return result.scalar_one_or_none()

    async def create(self, phone: str, first_name: str, last_name: str) -> Guest:
        guest = Guest(phone=phone, first_name=first_name, last_name=last_name)
        self.db.add(guest)
        await self.db.commit()
        await self.db.refresh(guest)
        return guest
