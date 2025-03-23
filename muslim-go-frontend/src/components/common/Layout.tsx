import React, { ReactNode } from 'react';
import { Box, Container, Flex } from '@chakra-ui/react';
import Navbar from './navbar';

interface LayoutProps {
  children: ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  return (
    <Box minH="100vh" bg="gray.50">
      <Navbar />
      <Container maxW="container.xl" py={8}>
        <Flex direction="column" gap={8}>
          {children}
        </Flex>
      </Container>
      <Box 
        as="footer" 
        py={6} 
        textAlign="center" 
        bg="white" 
        borderTop="1px" 
        borderColor="gray.200"
        mt={10}
      >
        MuslimGo Platform © {new Date().getFullYear()} | Shariah-compliant financial services
      </Box>
    </Box>
  );
};

export default Layout;