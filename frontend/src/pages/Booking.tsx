import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { DatePicker } from '@mantine/dates';
import {
  Card, Grid, Title, Text, Button, Badge, Group, Loader, Center, Alert, Stack,
  TextInput, Modal, Paper, Divider, ThemeIcon
} from '@mantine/core';
import { useForm } from '@mantine/form';
import { notifications } from '@mantine/notifications';
import {
  IconClock, IconCalendarEvent, IconAlertCircle, IconCheck, IconUser, IconPhone,
  IconChevronRight, IconArrowLeft
} from '@tabler/icons-react';
import { api } from '../api/client';
import type { DayOfWeek, CreateBookingRequest, Booking as BookingModel } from '../api/types';
import dayjs from 'dayjs';
import 'dayjs/locale/ru';

dayjs.locale('ru');

const DAYS_MAP: Record<number, DayOfWeek> = {
  1: 'Monday',
  2: 'Tuesday',
  3: 'Wednesday',
  4: 'Thursday',
  5: 'Friday',
  6: 'Saturday',
  0: 'Sunday',
};

export default function Booking() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [selectedDate, setSelectedDate] = useState<Date | null>(new Date());
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [bookingResult, setBookingResult] = useState<BookingModel | null>(null);

  const { data: appointmentType, isLoading, error } = useQuery({
    queryKey: ['appointmentType', id],
    queryKeyHashFn: () => `appointmentType-${id}`,
    queryFn: () => api.readAppointmentType(id!),
    enabled: !!id,
  });

  const form = useForm({
    initialValues: {
      firstName: '',
      lastName: '',
      phone: '',
    },
    validate: {
      firstName: (value) => (value.trim().length < 2 ? 'Имя должно содержать минимум 2 символа' : null),
      lastName: (value) => (value.trim().length < 2 ? 'Фамилия должна содержать минимум 2 символа' : null),
      phone: (value) => {
        const phoneRegex = /^\+?[1-9]\d{1,14}$/; // Простая валидация E.164
        if (!value.trim()) return 'Укажите номер телефона';
        if (!phoneRegex.test(value.trim())) return 'Неверный формат номера (используйте цифры, например +79991234567)';
        return null;
      },
    },
  });

  const createBookingMutation = useMutation({
    mutationFn: api.createBooking,
    onSuccess: (data) => {
      setBookingResult(data);
      setIsModalOpen(false);
      notifications.show({
        title: 'Успешно!',
        message: 'Вы успешно записались на приём!',
        color: 'green',
        icon: <IconCheck size={16} />,
      });
      // Обновляем слоты для этой услуги
      queryClient.invalidateQueries({ queryKey: ['appointmentType', id] });
    },
    onError: (err: unknown) => {
      notifications.show({
        title: 'Ошибка',
        message: (err as { message?: string }).message || 'Не удалось создать запись. Пожалуйста, попробуйте снова.',
        color: 'red',
        icon: <IconAlertCircle size={16} />,
      });
    },
  });

  if (isLoading) {
    return (
      <Center style={{ height: '50vh' }}>
        <Loader size="xl" type="dots" />
      </Center>
    );
  }

  if (error || !appointmentType) {
    return (
      <Alert icon={<IconAlertCircle size={16} />} title="Ошибка" color="red">
        Не удалось загрузить информацию об услуге.
         <Text size="xs" mt="xs">Детали: {(error as { message?: string })?.message || String(error)}</Text>
        <Button variant="outline" color="red" size="xs" mt="md" onClick={() => navigate('/')}>
          Вернуться на главную
        </Button>
      </Alert>
    );
  }

  // Ограничиваем календарь 14 днями: от сегодня до сегодня + 13 дней
  const minDate = new Date();
  const maxDate = dayjs().add(13, 'day').toDate();

  const formattedSelectedDate = selectedDate ? dayjs(selectedDate).format('YYYY-MM-DD') : '';

  // Получаем слоты для выбранного дня
  const slotsForSelectedDay = appointmentType.slots?.filter(
    (slot) => slot.date === formattedSelectedDate
  ) || [];

  const handleTimeSlotSelect = (time: string) => {
    setSelectedTimeSlot(time);
    setIsModalOpen(true);
  };

  const handleBookingSubmit = (values: typeof form.values) => {
    if (!selectedDate || !selectedTimeSlot || !id) return;

    const dayOfWeekIndex = selectedDate.getDay();
    const dayOfWeek = DAYS_MAP[dayOfWeekIndex];

    const bookingRequest: CreateBookingRequest = {
      appointmentTypeId: id,
      date: formattedSelectedDate,
      dayOfWeek,
      time: selectedTimeSlot.length === 5 ? `${selectedTimeSlot}:00` : selectedTimeSlot,
      phone: values.phone,
      firstName: values.firstName,
      lastName: values.lastName,
    };

    createBookingMutation.mutate(bookingRequest);
  };

  if (bookingResult) {
    return (
      <Center mt="xl">
        <Card shadow="md" padding="xl" radius="md" withBorder style={{ maxWidth: 500, width: '100%' }}>
          <Stack align="center" gap="md" ta="center">
            <ThemeIcon color="green" size={60} radius="xl" variant="light">
              <IconCheck size={36} />
            </ThemeIcon>
            <Title order={2} style={{ fontWeight: 800 }}>
              Вы записаны!
            </Title>
            <Text c="dimmed" size="sm">
              Код вашей записи был успешно зарегистрирован в системе.
            </Text>

            <Divider my="sm" style={{ width: '100%' }} />

            <Paper withBorder p="md" radius="sm" style={{ width: '100%', background: '#f8f9fa' }} ta="left">
              <Stack gap="xs">
                <Group justify="space-between">
                  <Text size="sm" c="dimmed">Услуга:</Text>
                  <Text size="sm" style={{ fontWeight: 600 }}>{appointmentType.name}</Text>
                </Group>
                <Group justify="space-between">
                  <Text size="sm" c="dimmed">Дата приёма:</Text>
                  <Text size="sm" style={{ fontWeight: 600 }}>
                    {dayjs(bookingResult.date).format('DD MMMM YYYY')} ({dayjs(bookingResult.date).format('dddd')})
                  </Text>
                </Group>
                <Group justify="space-between" align="center">
                  <Text size="sm" c="dimmed">Время приёма:</Text>
                  <Text size="xl" c="indigo" style={{ fontWeight: 800 }}>
                    {bookingResult.time.substring(0, 5)}
                  </Text>
                </Group>
                <Group justify="space-between">
                  <Text size="sm" c="dimmed">Имя гостя:</Text>
                  <Text size="sm" style={{ fontWeight: 600 }}>
                    {form.values.firstName} {form.values.lastName}
                  </Text>
                </Group>
                <Group justify="space-between">
                  <Text size="sm" c="dimmed">Телефон гостя:</Text>
                  <Text size="sm" style={{ fontWeight: 600 }}>{bookingResult.userId ? `Зарегистрирован (ID: ${bookingResult.userId})` : form.values.phone}</Text>
                </Group>
              </Stack>
            </Paper>

            <Button
              fullWidth
              color="indigo"
              onClick={() => {
                setBookingResult(null);
                setSelectedTimeSlot(null);
                form.reset();
                navigate('/');
              }}
            >
              Вернуться на главную
            </Button>
          </Stack>
        </Card>
      </Center>
    );
  }

  return (
    <Stack gap="lg">
      <Button
        variant="subtle"
        color="gray"
        leftSection={<IconArrowLeft size={16} />}
        onClick={() => navigate('/')}
        style={{ alignSelf: 'flex-start' }}
      >
        Назад к списку
      </Button>

      <Grid gutter="xl">
        {/* Левая колонка: Детали услуги */}
        <Grid.Col span={{ base: 12, md: 4 }}>
          <Card shadow="sm" radius="md" withBorder padding="xl" h="100%">
            <Stack gap="md">
              <Badge size="lg" color="indigo" variant="light" style={{ alignSelf: 'flex-start' }}>
                Детали приёма
              </Badge>
              <Title order={2} style={{ fontWeight: 800 }}>
                {appointmentType.name}
              </Title>
              <Divider />
              <Group gap="sm" c="dimmed">
                <IconClock size={20} />
                <Text style={{ fontWeight: 500 }}>Длительность: {appointmentType.slotDurationMinutes} минут</Text>
              </Group>
              <Group gap="sm" c="dimmed">
                <IconCalendarEvent size={20} />
                <Text style={{ fontWeight: 500 }}>
                  Часы работы: {dayjs(appointmentType.startTime).format('HH:mm')} – {dayjs(appointmentType.endTime).format('HH:mm')}
                </Text>
              </Group>
              <Text size="xs" c="dimmed" mt="md">
                Запись открыта на 14 дней вперёд. Выберите дату на календаре справа, затем укажите подходящее свободное время.
              </Text>
            </Stack>
          </Card>
        </Grid.Col>

        {/* Средняя колонка: Выбор Даты */}
        <Grid.Col span={{ base: 12, sm: 6, md: 4 }}>
          <Card shadow="sm" radius="md" withBorder padding="xl" h="100%">
            <Stack gap="md" align="center">
              <Badge size="md" color="indigo" variant="outline">
                Шаг 1: Выберите Дату
              </Badge>
              <DatePicker
                value={selectedDate}
                onChange={(val) => {
                  setSelectedDate(val);
                  setSelectedTimeSlot(null);
                }}
                minDate={minDate}
                maxDate={maxDate}
                locale="ru"
                size="md"
              />
            </Stack>
          </Card>
        </Grid.Col>

        {/* Правая колонка: Доступные Слоты */}
        <Grid.Col span={{ base: 12, sm: 6, md: 4 }}>
          <Card shadow="sm" radius="md" withBorder padding="xl" h="100%">
            <Stack gap="md">
              <Center>
                <Badge size="md" color="indigo" variant="outline">
                  Шаг 2: Выберите Время
                </Badge>
              </Center>

              {selectedDate ? (
                <>
                  <Text size="sm" style={{ fontWeight: 700 }} ta="center" c="dimmed">
                    {dayjs(selectedDate).format('D MMMM, dddd')}
                  </Text>
                  <Divider />
                  {slotsForSelectedDay.length === 0 ? (
                    <Center style={{ flex: 1, flexDirection: 'column' }} py="xl">
                      <IconAlertCircle size={32} color="var(--mantine-color-gray-4)" />
                      <Text size="sm" c="dimmed" mt="xs" ta="center">
                        Нет доступных слотов на этот день.
                      </Text>
                    </Center>
                  ) : (
                    <Stack gap="xs" style={{ maxHeight: 350, overflowY: 'auto' }} pr="xs">
                      {slotsForSelectedDay.map((slot, index) => {
                        const timeStr = slot.time.substring(0, 5);
                        return (
                          <Button
                            key={`${slot.time}-${index}`}
                            variant={slot.reserved ? 'light' : 'outline'}
                            color={slot.reserved ? 'gray' : 'indigo'}
                            disabled={slot.reserved}
                            onClick={() => handleTimeSlotSelect(slot.time)}
                            fullWidth
                            rightSection={!slot.reserved && <IconChevronRight size={14} />}
                            style={{
                              justifyContent: 'space-between',
                              height: 44,
                              opacity: slot.reserved ? 0.5 : 1,
                            }}
                          >
                            <Text style={{ fontWeight: 600 }}>{timeStr}</Text>
                            <Text size="xs">{slot.reserved ? 'Занято' : 'Свободно'}</Text>
                          </Button>
                        );
                      })}
                    </Stack>
                  )}
                </>
              ) : (
                <Center style={{ flex: 1 }}>
                  <Text size="sm" c="dimmed">Выберите дату на календаре.</Text>
                </Center>
              )}
            </Stack>
          </Card>
        </Grid.Col>
      </Grid>

      {/* Модальное окно подтверждения записи */}
      <Modal
        opened={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={<Text style={{ fontWeight: 700 }}>Подтверждение записи</Text>}
        centered
        size="md"
      >
        <form onSubmit={form.onSubmit(handleBookingSubmit)}>
          <Stack gap="md">
            <Paper p="sm" withBorder style={{ background: '#f8f9fa' }}>
              <Stack gap="xs">
                <Group justify="space-between">
                  <Text size="xs" c="dimmed">Услуга:</Text>
                  <Text size="xs" style={{ fontWeight: 600 }}>{appointmentType.name}</Text>
                </Group>
                <Group justify="space-between">
                  <Text size="xs" c="dimmed">Дата:</Text>
                  <Text size="xs" style={{ fontWeight: 600 }}>
                    {selectedDate ? dayjs(selectedDate).format('DD MMMM YYYY') : ''}
                  </Text>
                </Group>
                <Group justify="space-between">
                  <Text size="xs" c="dimmed">Время:</Text>
                  <Text size="xs" style={{ fontWeight: 600 }}>
                    {selectedTimeSlot ? selectedTimeSlot.substring(0, 5) : ''}
                  </Text>
                </Group>
              </Stack>
            </Paper>

            <Divider label="Укажите ваши данные" labelPosition="center" />

            <TextInput
              required
              label="Имя"
              placeholder="Иван"
              leftSection={<IconUser size={16} />}
              {...form.getInputProps('firstName')}
            />

            <TextInput
              required
              label="Фамилия"
              placeholder="Иванов"
              leftSection={<IconUser size={16} />}
              {...form.getInputProps('lastName')}
            />

            <TextInput
              required
              label="Номер телефона"
              placeholder="+79991234567"
              leftSection={<IconPhone size={16} />}
              description="Используется для проверки уникальности вашей записи"
              {...form.getInputProps('phone')}
            />

            <Group justify="flex-end" mt="md">
              <Button variant="subtle" color="gray" onClick={() => setIsModalOpen(false)}>
                Отмена
              </Button>
              <Button
                type="submit"
                color="indigo"
                loading={createBookingMutation.isPending}
              >
                Записаться
              </Button>
            </Group>
          </Stack>
        </form>
      </Modal>
    </Stack>
  );
}
