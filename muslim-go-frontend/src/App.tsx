import { Routes, Route } from 'react-router-dom';
import { ChakraProvider, extendTheme } from '@chakra-ui/react';
import { Web3Provider } from './contexts/Web3Context';
import Home from './pages/Home';
import Zakat from './pages/Zakat';
import Hajj from './pages/Hajj';

// Simple theme with Islamic colors
const theme = extendTheme({
  colors: {
    green: {
      500: '#4caf50',
      600: '#43a047',
    },
    teal: {
      500: '#009688',
      600: '#00897b',
    },
  },
});

function App() {
  return (
    <ChakraProvider theme={theme}>
      <Web3Provider>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/zakat" element={<Zakat />} />
          <Route path="/hajj" element={<Hajj />} />
        </Routes>
      </Web3Provider>
    </ChakraProvider>
  );
}

export default App;