from fastapi import FastAPI, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.dto import ErrorDTO
from app.routers import appointment_type, auth, booking

app = FastAPI(
    title="Zapisi.com API",
    description="Бэкенд для сервиса онлайн-записи (клон Cal.com)",
    version="0.1.0",
)

# Настройка CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Подключаем роутеры
app.include_router(auth.router)
app.include_router(booking.router)
app.include_router(appointment_type.router)


# Глобальный обработчик для красивых ошибок в формате ErrorDTO по контракту
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    # Если это HTTPException из FastAPI, вернем его статус и сообщение
    from fastapi.exceptions import HTTPException as FastAPIHTTPException
    if isinstance(exc, FastAPIHTTPException):
        return JSONResponse(
            status_code=exc.status_code,
            content={"code": exc.status_code, "message": exc.detail},
        )
    
    # Иначе возвращаем 500 ошибку
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={
            "code": status.HTTP_500_INTERNAL_SERVER_ERROR,
            "message": f"Внутренняя ошибка сервера: {str(exc)}",
        },
    )


@app.get("/", tags=["Root"])
async def root():
    return {"message": "Zapisi.com API is running"}
