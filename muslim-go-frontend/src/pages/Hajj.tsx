import React from 'react';
import { 
  Box, 
  Heading, 
  Text, 
  Flex,
  useColorModeValue,
  Container,
  SimpleGrid
} from '@chakra-ui/react';
import Layout from '../components/common/Layout';
import HajjAccount from '../components/hajj/HajjAccount';

const Hajj: React.FC = () => {
  const bgGradient = useColorModeValue(
    'linear(to-r, green.400, teal.500)',
    'linear(to-r, green.500, teal.600)'
  );

  return (
    <Layout>
      <Box 
        as="section" 
        bgGradient={bgGradient} 
        color="white" 
        py={12} 
        px={4} 
        borderRadius="lg"
        mb={8}
      >
        <Container maxW="container.lg">
          <Heading as="h1" size="xl" mb={4}>
            Hajj Savings Program
          </Heading>
          <Text fontSize="lg" maxW="container.md">
            Plan and save for your Hajj pilgrimage with our premium, Shariah-compliant savings account.
            Set goals, track progress, and manage your funds securely through smart contracts.
          </Text>
        </Container>
      </Box>

      <Container maxW="container.lg">
        <SimpleGrid columns={{ base: 1, lg: 2 }} spacing={8}>
          <Box>
            <HajjAccount />
          </Box>
          
          <Flex direction="column" gap={6}>
            <Box p={6} bg="white" borderRadius="lg" boxShadow="base">
              <Heading size="md" mb={4}>About the Hajj Program</Heading>
              <Text mb={4}>
                The Hajj pilgrimage is one of the Five Pillars of Islam, required for every Muslim who is physically 
                and financially able to perform it at least once in their lifetime.
              </Text>
              <Text mb={4}>
                Our Hajj Savings Program helps you:
              </Text>
              <Flex direction="column" gap={2} pl={4} mb={4}>
                <Text>• Set a realistic savings goal based on your planned pilgrimage</Text>
                <Text>• Make regular contributions to your dedicated Hajj fund</Text>
                <Text>• Track your progress towards your goal with visual indicators</Text>
                <Text>• Ensure your savings are managed in a Shariah-compliant manner</Text>
                <Text>• Access your funds when you're ready for your journey</Text>
              </Flex>
              <Text>
                This premium feature is available to verified users only, ensuring the highest standards of
                security and compliance.
              </Text>
            </Box>
            
            <Box p={6} bg="white" borderRadius="lg" boxShadow="base">
              <Heading size="md" mb={4}>How Verification Works</Heading>
              <Text mb={4}>
                Our platform uses zero-knowledge proofs to verify your premium status without exposing 
                your personal information. This technology ensures that:
              </Text>
              <Flex direction="column" gap={2} pl={4}>
                <Text>• Your personal data remains private and secure</Text>
                <Text>• Only you can access and manage your funds</Text>
                <Text>• The verification process is transparent and auditable</Text>
                <Text>• Smart contracts automatically manage fund releases</Text>
              </Flex>
            </Box>
          </Flex>
        </SimpleGrid>
      </Container>
    </Layout>
  );
};

export default Hajj;