import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import {
  Card, Title, Text, Button, Stack, PasswordInput, Center, Container,
  ThemeIcon, Alert
} from '@mantine/core';
import { useForm } from '@mantine/form';
import { notifications } from '@mantine/notifications';
import { IconLock, IconCheck, IconAlertCircle, IconArrowLeft } from '@tabler/icons-react';
import { api } from '../api/client';

export default function AdminLogin() {
  const navigate = useNavigate();
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Если уже авторизован, перенаправляем в админку
  useEffect(() => {
    if (localStorage.getItem('isAdminAuthenticated') === 'true') {
      navigate('/admin', { replace: true });
    }
  }, [navigate]);

  const form = useForm({
    initialValues: {
      password: '',
    },
    validate: {
      password: (value) => (!value ? 'Пароль обязателен' : null),
    },
  });

  const loginMutation = useMutation({
    mutationFn: api.login,
    onSuccess: () => {
      localStorage.setItem('isAdminAuthenticated', 'true');
      notifications.show({
        title: 'Авторизация успешна',
        message: 'Добро пожаловать в панель управления!',
        color: 'green',
        icon: <IconCheck size={16} />,
      });
      navigate('/admin', { replace: true });
    },
    onError: (err: unknown) => {
      setErrorMsg((err as { message?: string }).message || 'Неверный пароль. Пожалуйста, попробуйте снова.');
    },
  });

  const handleSubmit = (values: typeof form.values) => {
    setErrorMsg(null);
    loginMutation.mutate({ password: values.password });
  };

  return (
    <Container size="xs" mt="xl">
      <Button
        variant="subtle"
        color="gray"
        leftSection={<IconArrowLeft size={16} />}
        onClick={() => navigate('/')}
        mb="md"
      >
        На главную страницу
      </Button>

      <Center style={{ minHeight: '60vh', flexDirection: 'column' }}>
        <Card shadow="md" padding="xl" radius="md" withBorder style={{ width: '100%' }}>
          <form onSubmit={form.onSubmit(handleSubmit)}>
            <Stack gap="md" align="center" ta="center" mb="lg">
              <ThemeIcon color="indigo" size={50} radius="xl" variant="light">
                <IconLock size={28} />
              </ThemeIcon>
              <div>
                <Title order={2} style={{ fontWeight: 800 }}>Вход в админ-панель</Title>
                <Text size="sm" c="dimmed" mt="xs">
                  Введите пароль мастера для настройки типов записей и доступных часов работы.
                </Text>
              </div>
            </Stack>

            <Stack gap="md">
              {errorMsg && (
                <Alert icon={<IconAlertCircle size={16} />} title="Ошибка входа" color="red">
                  {errorMsg}
                </Alert>
              )}

              <PasswordInput
                required
                label="Пароль"
                placeholder="Ваш секретный пароль"
                {...form.getInputProps('password')}
              />

              <Button
                type="submit"
                fullWidth
                color="indigo"
                loading={loginMutation.isPending}
                mt="md"
              >
                Войти
              </Button>
            </Stack>
          </form>
        </Card>
      </Center>
    </Container>
  );
}
