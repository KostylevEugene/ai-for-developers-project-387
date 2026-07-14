import { createTheme } from '@mantine/core';

export const theme = createTheme({
  primaryColor: 'indigo',
  fontFamily: 'Inter, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
  defaultRadius: 'md',
  headings: {
    fontFamily: 'Inter, system-ui, sans-serif',
  },
  components: {
    Button: {
      defaultProps: {
        loaderProps: { type: 'dots' },
      },
    },
    Input: {
      defaultProps: {
        size: 'sm',
      },
    },
    Card: {
      defaultProps: {
        padding: 'md',
        radius: 'md',
        withBorder: true,
      },
    },
  },
});
