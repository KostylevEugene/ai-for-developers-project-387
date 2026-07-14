import "@typespec/http";
import "@typespec/rest";
import "@typespec/openapi3";

using Http;

@service(#{
  title: "Booking Service (cal.com clone)"
})
namespace BookingService;

// --- Перечисления и общие модели ---

enum DayOfWeek {
  Monday,
  Tuesday,
  Wednesday,
  Thursday,
  Friday,
  Saturday,
  Sunday,
}

@error
model Error {
  code: int32;
  message: string;
}

// --- Сущности ---

model Guest {
  id: int32;
  phone: string;
  firstName: string;
  lastName: string;
}

model AppointmentType {
  id: string;
  name: string;
  startTime: utcDateTime;
  endTime: utcDateTime;
  slotDurationMinutes: int32;
  slots?: Slot[]; // Генерируется на лету при GET /appointment-types/{id}
}

model Slot {
  date: plainDate;
  dayOfWeek: DayOfWeek;
  time: plainTime;
  reserved: boolean;
}

model Booking {
  id: string;
  date: plainDate;
  dayOfWeek: DayOfWeek;
  time: plainTime;
  userId: int32;
  appointmentTypeId: string;
}

// --- Запросы ---

model CreateBookingRequest {
  appointmentTypeId: string;
  date: plainDate;
  dayOfWeek: DayOfWeek;
  time: plainTime;
  phone: string;
  firstName: string;
  lastName: string;
}

model LoginRequest {
  password: string;
}

// --- API Эндпоинты ---

@route("/auth")
@tag("Authentication")
interface Auth {
  /** Проверить пароль автора. Возвращает статус 204 при успешной проверке или ошибку. */
  @route("/login")
  @post login(@body body: LoginRequest): void | Error;
}

@route("/booking")
@tag("Bookings")
interface Bookings {
  /** Создать запись на выбранный слот с автоматической регистрацией/поиском гостя по телефону */
  @post create(@body body: CreateBookingRequest): Booking | Error;
}

@route("/appointment-types")
@tag("Appointment Types")
interface AppointmentTypes {
  /** Список типов записей */
  @get list(): AppointmentType[] | Error;

  /** Детальная информация о типе записи со всей сеткой слотов на 14 дней */
  @get read(@path id: string): AppointmentType | Error;

  /** Создать новый тип записи */
  @post create(@body body: OmitProperties<AppointmentType, "id" | "slots">): AppointmentType | Error;

  /** Редактировать тип записи */
  @patch update(@path id: string, @body body: OmitProperties<OptionalProperties<AppointmentType>, "id" | "slots">): AppointmentType | Error;

  /** Удалить тип записи */
  @delete delete(@path id: string): void | Error;
}
