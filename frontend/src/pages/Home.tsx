import { useQuery } from '@tanstack/react-query';
import { Card, SimpleGrid, Title, Text, Button, Badge, Group, Loader, Center, Alert, Stack } from '@mantine/core';
import { useNavigate } from 'react-router-dom';
import { IconClock, IconCalendarCheck, IconAlertCircle, IconUserCheck } from '@tabler/icons-react';
import { api } from '../api/client';
import dayjs from 'dayjs';

export default function Home() {
  const navigate = useNavigate();

  const { data: appointmentTypes, isLoading, error } = useQuery({
    queryKey: ['appointmentTypes'],
    queryKeyHashFn: () => 'appointmentTypes',
    queryFn: api.listAppointmentTypes,
  });

  const formatTime = (isoString: string) => {
    return dayjs(isoString).format('HH:mm');
  };

  if (isLoading) {
    return (
      <Center style={{ height: '50vh' }}>
        <Loader size="xl" type="dots" />
      </Center>
    );
  }

  if (error) {
    return (
      <Alert icon={<IconAlertCircle size={16} />} title="Ошибка" color="red">
        Не удалось загрузить типы записей. Пожалуйста, убедитесь, что бэкенд (или эмулятор Prism) запущен.
        <br />
        <Text size="xs" mt="xs">Детали: {(error as { message?: string }).message || String(error)}</Text>
      </Alert>
    );
  }

  return (
    <Stack gap="xl">
      <div style={{ textAlign: 'center', maxWidth: 600, margin: '0 auto' }}>
        <Title order={1} style={{ fontSize: '2.5rem', fontWeight: 900, letterSpacing: '-1px' }}>
          Онлайн-запись к специалистам
        </Title>
        <Text c="dimmed" size="lg" mt="xs">
          Выберите подходящую услугу, удобную дату и время для визита. Это займёт меньше минуты.
        </Text>
      </div>

      {!appointmentTypes || appointmentTypes.length === 0 ? (
        <Card shadow="sm" p="lg" radius="md" style={{ maxWidth: 500, margin: '0 auto', textAlign: 'center' }}>
          <Stack align="center" gap="sm">
            <IconCalendarCheck size={48} color="var(--mantine-color-gray-4)" />
            <Text size="lg" style={{ fontWeight: 600 }}>Пока нет доступных услуг</Text>
            <Text c="dimmed" size="sm">
              Специалист ещё не настроил расписание работы на ближайшие 14 дней.
            </Text>
            <Button variant="light" color="indigo" onClick={() => navigate('/admin')}>
              Перейти в панель мастера
            </Button>
          </Stack>
        </Card>
      ) : (
        <SimpleGrid cols={{ base: 1, sm: 2, md: 3 }} spacing="lg">
          {appointmentTypes.map((type) => (
            <Card key={type.id} shadow="sm" radius="md" withBorder padding="xl">
              <Stack gap="md" justify="space-between" h="100%">
                <div>
                  <Group justify="space-between" mb="xs">
                    <Badge color="indigo" variant="light" size="lg">
                      Услуга
                    </Badge>
                  </Group>

                  <Text size="lg" style={{ fontWeight: 700, minHeight: '3rem' }} lineClamp={2}>
                    {type.name}
                  </Text>

                  <Group gap="xs" mt="md" c="dimmed">
                    <IconClock size={16} />
                    <Text size="sm">
                      Длительность приёма: {type.slotDurationMinutes} мин
                    </Text>
                  </Group>

                  <Group gap="xs" mt="xs" c="dimmed">
                    <IconUserCheck size={16} />
                    <Text size="sm">
                      Время работы: {formatTime(type.startTime)} – {formatTime(type.endTime)}
                    </Text>
                  </Group>
                </div>

                <Button
                  fullWidth
                  variant="filled"
                  color="indigo"
                  mt="xl"
                  onClick={() => navigate(`/book/${type.id}`)}
                >
                  Записаться
                </Button>
              </Stack>
            </Card>
          ))}
        </SimpleGrid>
      )}
    </Stack>
  );
}
