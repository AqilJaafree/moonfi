import React from 'react';
import { 
  Box, 
  Heading, 
  Text, 
  Stack, 
  SimpleGrid,
  Button,
  useColorMode,
  Container,
  Icon
} from '@chakra-ui/react';
import { Link } from 'react-router-dom';
import { FaCalculator, FaMoneyBillWave, FaPrayingHands, FaMosque } from 'react-icons/fa';
import Layout from '../components/common/Layout';
import { useWeb3 } from '../contexts/Web3Context';

const Home: React.FC = () => {
  const { connectWallet, account } = useWeb3();
  const { colorMode } = useColorMode();
  
  const bgGradient = colorMode === 'light' 
    ? 'linear(to-r, green.400, teal.500)'
    : 'linear(to-r, green.500, teal.600)';
  
  const cardBg = colorMode === 'light' ? 'white' : 'gray.700';

  return (
    <Layout>
      <Box 
        as="section" 
        bgGradient={bgGradient} 
        color="white" 
        py={16} 
        px={4} 
        borderRadius="lg"
        textAlign="center"
      >
        <Container maxW="container.lg">
          <Heading as="h1" size="2xl" mb={4}>
            MuslimGo Financial Platform
          </Heading>
          <Text fontSize="xl" maxW="container.md" mx="auto" mb={8}>
            A blockchain-based platform designed specifically for Muslims to fulfill religious financial obligations through Shariah-compliant mechanisms.
          </Text>
          {!account ? (
            <Button 
              colorScheme="whiteAlpha" 
              variant="outline" 
              size="lg" 
              onClick={connectWallet}
              _hover={{ bg: 'whiteAlpha.300' }}
            >
              Connect Wallet to Start
            </Button>
          ) : (
            <Stack direction="row" spacing={4} justify="center">
              <Link to="/zakat">
                <Button 
                  colorScheme="whiteAlpha" 
                  variant="outline" 
                  size="lg"
                  _hover={{ bg: 'whiteAlpha.300' }}
                >
                  Pay Zakat
                </Button>
              </Link>
              <Link to="/hajj">
                <Button 
                  colorScheme="whiteAlpha" 
                  variant="outline" 
                  size="lg"
                  _hover={{ bg: 'whiteAlpha.300' }}
                >
                  Save for Hajj
                </Button>
              </Link>
            </Stack>
          )}
        </Container>
      </Box>

      <Box as="section" py={16}>
        <Heading as="h2" size="xl" mb={8} textAlign="center">
          Our Services
        </Heading>
        
        <SimpleGrid columns={{ base: 1, md: 2 }} spacing={8}>
          <Box 
            p={6} 
            borderRadius="lg" 
            boxShadow="base" 
            bg={cardBg}
            transition="transform 0.3s"
            _hover={{ transform: 'translateY(-5px)', boxShadow: 'lg' }}
          >
            <Icon as={FaCalculator} w={10} h={10} color="green.500" mb={4} />
            <Heading as="h3" size="md" mb={3}>
              Zakat Management System
            </Heading>
            <Text mb={4}>
              Our basic service for all users provides automated calculation of 2.5% Zakat obligation on eligible assets. 
              Enjoy transparent distribution to approved charitable organizations with complete privacy.
            </Text>
            <Link to="/zakat">
              <Button 
                colorScheme="green" 
                variant="outline"
              >
                Calculate & Pay Zakat
              </Button>
            </Link>
          </Box>
          
          <Box 
            p={6} 
            borderRadius="lg" 
            boxShadow="base" 
            bg={cardBg}
            transition="transform 0.3s"
            _hover={{ transform: 'translateY(-5px)', boxShadow: 'lg' }}
          >
            <Icon as={FaMosque} w={10} h={10} color="green.500" mb={4} />
            <Heading as="h3" size="md" mb={3}>
              Hajj Preparation Program
            </Heading>
            <Text mb={4}>
              Premium tier feature with enhanced services for Hajj savings. Our Shariah-compliant fund management 
              helps you save for the pilgrimage with smart contract-managed funds that release upon goal achievement.
            </Text>
            <Link to="/hajj">
              <Button 
                colorScheme="green" 
                variant="outline"
              >
                Start Saving for Hajj
              </Button>
            </Link>
          </Box>
        </SimpleGrid>
      </Box>

      <Box as="section" py={16} bg="gray.50" borderRadius="lg" p={8}>
        <Heading as="h2" size="xl" mb={8} textAlign="center">
          Why Choose MuslimGo?
        </Heading>
        
        <SimpleGrid columns={{ base: 1, md: 2 }} spacing={8}>
          <Stack direction="row" align="start" spacing={4}>
            <Icon as={FaPrayingHands} w={8} h={8} color="green.500" mt={1} />
            <Box>
              <Heading as="h3" size="md" mb={2}>
                Shariah Compliance
              </Heading>
              <Text>
                All our financial mechanisms are designed to be fully compliant with Islamic financial principles.
                No riba (interest) and focus on purpose-driven financial planning.
              </Text>
            </Box>
          </Stack>
          
          <Stack direction="row" align="start" spacing={4}>
            <Icon as={FaMoneyBillWave} w={8} h={8} color="green.500" mt={1} />
            <Box>
              <Heading as="h3" size="md" mb={2}>
                Transparent Distribution
              </Heading>
              <Text>
                Clear tracking of all distributions with blockchain verification. Know exactly where your 
                Zakat contributions are going with complete auditability.
              </Text>
            </Box>
          </Stack>
        </SimpleGrid>
      </Box>
    </Layout>
  );
};

export default Home;