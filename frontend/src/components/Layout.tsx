import { AppShell, Container, Group, Title, Text, Button } from '@mantine/core';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { IconCalendarEvent, IconLock, IconLogout } from '@tabler/icons-react';

export function Layout() {
  const navigate = useNavigate();
  const location = useLocation();
  const isAdminPage = location.pathname.startsWith('/admin');
  const isAuthenticated = localStorage.getItem('isAdminAuthenticated') === 'true';

  const handleLogout = () => {
    localStorage.removeItem('isAdminAuthenticated');
    navigate('/admin/login');
  };

  return (
    <AppShell
      header={{ height: 60 }}
      styles={{
        main: {
          background: '#f8f9fa',
          minHeight: '100vh',
        },
      }}
    >
      <AppShell.Header>
        <Container size="lg" h="100%">
          <Group justify="space-between" h="100%">
            <Group style={{ cursor: 'pointer' }} onClick={() => navigate('/')}>
              <IconCalendarEvent size={28} color="var(--mantine-color-indigo-6)" />
              <Title order={3} style={{ fontWeight: 800, letterSpacing: '-0.5px' }}>
                Zapisi.<span style={{ color: 'var(--mantine-color-indigo-6)' }}>com</span>
              </Title>
            </Group>

            <Group gap="sm">
              {isAdminPage ? (
                isAuthenticated ? (
                  <Group gap="xs">
                    <Button
                      variant="subtle"
                      color="gray"
                      size="xs"
                      onClick={() => navigate('/')}
                    >
                      К списку приёмов
                    </Button>
                    <Button
                      variant="light"
                      color="red"
                      leftSection={<IconLogout size={16} />}
                      onClick={handleLogout}
                      size="xs"
                    >
                      Выйти
                    </Button>
                  </Group>
                ) : (
                  <Button
                    variant="subtle"
                    onClick={() => navigate('/')}
                    size="xs"
                  >
                    На главную
                  </Button>
                )
              ) : (
                <Button
                  variant="subtle"
                  color="indigo"
                  leftSection={<IconLock size={14} />}
                  onClick={() => navigate(isAuthenticated ? '/admin' : '/admin/login')}
                  size="xs"
                >
                  Админка мастера
                </Button>
              )}
            </Group>
          </Group>
        </Container>
      </AppShell.Header>

      <AppShell.Main py="xl">
        <Container size="lg" style={{ flex: 1 }}>
          <Outlet />
        </Container>
        <Container size="lg" mt="xl" py="md" style={{ borderTop: '1px solid #e9ecef' }}>
          <Text size="xs" c="dimmed" ta="center">
            &copy; {new Date().getFullYear()} Zapisi.com (Клон Cal.com). Разработано для Hexlet.
          </Text>
        </Container>
      </AppShell.Main>
    </AppShell>
  );
}
