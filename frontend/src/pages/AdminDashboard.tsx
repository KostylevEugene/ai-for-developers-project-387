import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Card, Title, Text, Button, Table, Badge, Group, Loader, Center, Alert,
  Stack, Modal, TextInput, NumberInput, Divider, ActionIcon, Tooltip
} from '@mantine/core';
import { useForm } from '@mantine/form';
import { notifications } from '@mantine/notifications';
import {
  IconPlus, IconEdit, IconTrash, IconClock, IconAlertCircle, IconCheck,
  IconExternalLink, IconCalendarTime
} from '@tabler/icons-react';
import { api } from '../api/client';
import type { AppointmentType } from '../api/types';
import dayjs from 'dayjs';

export default function AdminDashboard() {
  const queryClient = useQueryClient();
  const [openedModal, setOpenedModal] = useState<'create' | 'edit' | 'delete' | null>(null);
  const [selectedType, setSelectedType] = useState<AppointmentType | null>(null);

  // Список всех типов записей
  const { data: appointmentTypes, isLoading, error } = useQuery({
    queryKey: ['appointmentTypesAdmin'],
    queryKeyHashFn: () => 'appointmentTypesAdmin',
    queryFn: api.listAppointmentTypes,
  });

  const form = useForm({
    initialValues: {
      name: '',
      startTimeStr: '09:00',
      endTimeStr: '18:00',
      slotDurationMinutes: 30,
    },
    validate: {
      name: (value) => (value.trim().length < 3 ? 'Название должно быть не менее 3 символов' : null),
      startTimeStr: (value) => (!value ? 'Укажите время начала работы' : null),
      endTimeStr: (value, values) => {
        if (!value) return 'Укажите время завершения работы';
        if (value <= values.startTimeStr) {
          return 'Время окончания должно быть позже времени начала';
        }
        return null;
      },
      slotDurationMinutes: (value) => {
        if (!value) return 'Укажите длительность слота';
        if (value < 5 || value > 480) return 'Длительность должна быть от 5 до 480 минут';
        return null;
      },
    },
  });

  // Мутация на создание
  const createMutation = useMutation({
    mutationFn: api.createAppointmentType,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['appointmentTypesAdmin'] });
      queryClient.invalidateQueries({ queryKey: ['appointmentTypes'] });
      setOpenedModal(null);
      form.reset();
      notifications.show({
        title: 'Успешно создано',
        message: 'Новый тип записи успешно добавлен!',
        color: 'green',
        icon: <IconCheck size={16} />,
      });
    },
    onError: (err: unknown) => {
      notifications.show({
        title: 'Ошибка',
        message: (err as { message?: string }).message || 'Не удалось создать тип записи',
        color: 'red',
        icon: <IconAlertCircle size={16} />,
      });
    },
  });

  // Мутация на редактирование
  const updateMutation = useMutation({
    mutationFn: ({ id, body }: { id: string; body: Partial<Omit<AppointmentType, 'id' | 'slots'>> }) =>
      api.updateAppointmentType(id, body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['appointmentTypesAdmin'] });
      queryClient.invalidateQueries({ queryKey: ['appointmentTypes'] });
      setOpenedModal(null);
      setSelectedType(null);
      form.reset();
      notifications.show({
        title: 'Успешно обновлено',
        message: 'Тип записи успешно отредактирован!',
        color: 'green',
        icon: <IconCheck size={16} />,
      });
    },
    onError: (err: unknown) => {
      notifications.show({
        title: 'Ошибка',
        message: (err as { message?: string }).message || 'Не удалось обновить тип записи',
        color: 'red',
        icon: <IconAlertCircle size={16} />,
      });
    },
  });

  // Мутация на удаление
  const deleteMutation = useMutation({
    mutationFn: api.deleteAppointmentType,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['appointmentTypesAdmin'] });
      queryClient.invalidateQueries({ queryKey: ['appointmentTypes'] });
      setOpenedModal(null);
      setSelectedType(null);
      notifications.show({
        title: 'Успешно удалено',
        message: 'Тип записи был успешно удалён',
        color: 'green',
        icon: <IconCheck size={16} />,
      });
    },
    onError: (err: unknown) => {
      notifications.show({
        title: 'Ошибка',
        message: (err as { message?: string }).message || 'Не удалось удалить тип записи',
        color: 'red',
        icon: <IconAlertCircle size={16} />,
      });
    },
  });

  const handleOpenCreate = () => {
    form.reset();
    setOpenedModal('create');
  };

  const handleOpenEdit = (type: AppointmentType) => {
    setSelectedType(type);
    form.setValues({
      name: type.name,
      startTimeStr: dayjs(type.startTime).format('HH:mm'),
      endTimeStr: dayjs(type.endTime).format('HH:mm'),
      slotDurationMinutes: type.slotDurationMinutes,
    });
    setOpenedModal('edit');
  };

  const handleOpenDelete = (type: AppointmentType) => {
    setSelectedType(type);
    setOpenedModal('delete');
  };

  const handleFormSubmit = (values: typeof form.values) => {
    // Строим ISO строки с корректной датой (берём сегодняшний день)
    const [startH, startM] = values.startTimeStr.split(':').map(Number);
    const [endH, endM] = values.endTimeStr.split(':').map(Number);

    const today = dayjs();
    // Отправляем наивный ISO (без смещения таймзоны): часы работы — это
    // "время суток", а не точка во времени. Ранее .toISOString() переводил
    // локальное время в UTC, из-за чего на бэке .time() возвращал сдвинутое
    // значение и сетка слотов строилась неверно (см. issue «Время брони»).
    const startTimeIso = today.hour(startH).minute(startM).second(0).millisecond(0).format('YYYY-MM-DDTHH:mm:ss');
    const endTimeIso = today.hour(endH).minute(endM).second(0).millisecond(0).format('YYYY-MM-DDTHH:mm:ss');

    const body = {
      name: values.name,
      startTime: startTimeIso,
      endTime: endTimeIso,
      slotDurationMinutes: values.slotDurationMinutes,
    };

    if (openedModal === 'create') {
      createMutation.mutate(body);
    } else if (openedModal === 'edit' && selectedType) {
      updateMutation.mutate({ id: selectedType.id, body });
    }
  };

  const handleDeleteConfirm = () => {
    if (selectedType) {
      deleteMutation.mutate(selectedType.id);
    }
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
        Не удалось загрузить данные в админ-панель.
        <br />
        <Text size="xs" mt="xs">Детали: {(error as { message?: string }).message || String(error)}</Text>
      </Alert>
    );
  }

  return (
    <Stack gap="xl">
      <Group justify="space-between">
        <div>
          <Title order={1} style={{ fontWeight: 900, letterSpacing: '-0.5px' }}>
            Управление приёмами
          </Title>
          <Text c="dimmed" size="sm" mt="xs">
            Создавайте новые виды встреч, указывайте время начала/конца работы и промежутки. Сетка слотов генерируется на 14 дней автоматически.
          </Text>
        </div>
        <Button
          leftSection={<IconPlus size={16} />}
          color="indigo"
          onClick={handleOpenCreate}
        >
          Создать тип записи
        </Button>
      </Group>

      <Card withBorder shadow="xs" padding="0" radius="md" style={{ overflow: 'hidden' }}>
        {(!appointmentTypes || appointmentTypes.length === 0) ? (
          <Center py="xl" style={{ flexDirection: 'column' }}>
            <IconCalendarTime size={48} color="var(--mantine-color-gray-4)" />
            <Text mt="md" style={{ fontWeight: 600 }}>Нет созданных типов записей</Text>
            <Text size="sm" c="dimmed" mt="xs">Нажмите «Создать тип записи», чтобы добавить первую услугу.</Text>
          </Center>
        ) : (
          <Table verticalSpacing="md" horizontalSpacing="lg" highlightOnHover>
            <Table.Thead style={{ background: '#f8f9fa' }}>
              <Table.Tr>
                <Table.Th style={{ fontWeight: 700 }}>Услуга (Тип записи)</Table.Th>
                <Table.Th style={{ fontWeight: 700 }}>Интервал (Слот)</Table.Th>
                <Table.Th style={{ fontWeight: 700 }}>Время работы</Table.Th>
                <Table.Th style={{ fontWeight: 700 }}>ID</Table.Th>
                <Table.Th style={{ fontWeight: 700, width: 150 }} ta="right">Действия</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {appointmentTypes.map((type) => (
                <Table.Tr key={type.id}>
                  <Table.Td style={{ fontWeight: 600 }}>{type.name}</Table.Td>
                  <Table.Td>
                    <Badge color="blue" variant="light" leftSection={<IconClock size={12} />}>
                      {type.slotDurationMinutes} минут
                    </Badge>
                  </Table.Td>
                  <Table.Td style={{ fontFamily: 'monospace' }}>
                    {dayjs(type.startTime).format('HH:mm')} – {dayjs(type.endTime).format('HH:mm')}
                  </Table.Td>
                  <Table.Td style={{ fontSize: '0.8rem', color: 'var(--mantine-color-gray-5)' }}>
                    <code>{type.id}</code>
                  </Table.Td>
                  <Table.Td>
                    <Group gap="xs" justify="flex-end">
                      <Tooltip label="Открыть страницу записи гостя">
                        <ActionIcon
                          variant="light"
                          color="indigo"
                          onClick={() => window.open(`/book/${type.id}`, '_blank')}
                        >
                          <IconExternalLink size={16} />
                        </ActionIcon>
                      </Tooltip>
                      <Tooltip label="Редактировать">
                        <ActionIcon
                          variant="light"
                          color="yellow"
                          onClick={() => handleOpenEdit(type)}
                        >
                          <IconEdit size={16} />
                        </ActionIcon>
                      </Tooltip>
                      <Tooltip label="Удалить">
                        <ActionIcon
                          variant="light"
                          color="red"
                          onClick={() => handleOpenDelete(type)}
                        >
                          <IconTrash size={16} />
                        </ActionIcon>
                      </Tooltip>
                    </Group>
                  </Table.Td>
                </Table.Tr>
              ))}
            </Table.Tbody>
          </Table>
        )}
      </Card>

      {/* Модальное окно создания/редактирования */}
      <Modal
        opened={openedModal === 'create' || openedModal === 'edit'}
        onClose={() => setOpenedModal(null)}
        title={
          <Text style={{ fontWeight: 700 }}>
            {openedModal === 'create' ? 'Создание нового типа записи' : 'Редактирование типа записи'}
          </Text>
        }
        centered
        size="md"
      >
        <form onSubmit={form.onSubmit(handleFormSubmit)}>
          <Stack gap="md">
            <TextInput
              required
              label="Название приёма (услуги)"
              placeholder="Приём терапевта, Стрижка под машинку"
              {...form.getInputProps('name')}
            />

            <Group grow>
              <TextInput
                required
                type="time"
                label="Начало работы"
                {...form.getInputProps('startTimeStr')}
              />
              <TextInput
                required
                type="time"
                label="Окончание работы"
                {...form.getInputProps('endTimeStr')}
              />
            </Group>

            <NumberInput
              required
              label="Длительность одного приёма (минут)"
              placeholder="30"
              min={5}
              max={480}
              {...form.getInputProps('slotDurationMinutes')}
            />

            <Divider my="sm" />

            <Group justify="flex-end">
              <Button variant="subtle" color="gray" onClick={() => setOpenedModal(null)}>
                Отмена
              </Button>
              <Button
                type="submit"
                color="indigo"
                loading={createMutation.isPending || updateMutation.isPending}
              >
                {openedModal === 'create' ? 'Создать' : 'Сохранить'}
              </Button>
            </Group>
          </Stack>
        </form>
      </Modal>

      {/* Модальное окно подтверждения удаления */}
      <Modal
        opened={openedModal === 'delete'}
        onClose={() => setOpenedModal(null)}
        title={<Text style={{ fontWeight: 700, color: 'var(--mantine-color-red-6)' }}>Удаление типа записи</Text>}
        centered
        size="sm"
      >
        <Stack gap="md">
          <Text size="sm">
            Вы действительно хотите удалить тип записи <strong>«{selectedType?.name}»</strong>?
            Это действие необратимо и все сформированные слоты для него будут удалены.
          </Text>
          <Group justify="flex-end" mt="md">
            <Button variant="subtle" color="gray" onClick={() => setOpenedModal(null)}>
              Отмена
            </Button>
            <Button
              color="red"
              onClick={handleDeleteConfirm}
              loading={deleteMutation.isPending}
            >
              Удалить
            </Button>
          </Group>
        </Stack>
      </Modal>
    </Stack>
  );
}
