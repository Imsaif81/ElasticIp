import { extendTheme } from '@chakra-ui/react';

const theme = extendTheme({
  fonts: {
    heading: "'Roboto', sans-serif",
    body: "'Open Sans', sans-serif",
  },
  colors: {
    brand: {
      100: "#f7fafc",
      500: "#3182ce",
      900: "#1a202c",
    },
  },
});

export default theme;
