import React from 'react';
import { 
  Box, 
  Heading, 
  Text,
  Tab, 
  Tabs, 
  TabList, 
  TabPanels, 
  TabPanel,
  useColorModeValue,
  Container
} from '@chakra-ui/react';
import Layout from '../components/common/Layout';
import ZakatCalculator from '../components/zakat/ZakatCalculator';
import ZakatDistribution from '../components/zakat/ZakatDistribution';

const Zakat: React.FC = () => {
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
            Zakat Management System
          </Heading>
          <Text fontSize="lg" maxW="container.md">
            Calculate, pay, and track your Zakat obligations with our privacy-preserving, Shariah-compliant service.
            Zakat is calculated at 2.5% of eligible assets that meet the Nisab threshold.
          </Text>
        </Container>
      </Box>

      <Container maxW="container.lg">
        <Tabs colorScheme="green" variant="enclosed" isLazy>
          <TabList>
            <Tab>Calculate & Pay</Tab>
            <Tab>Distribution</Tab>
          </TabList>
          
          <TabPanels>
            <TabPanel px={0}>
              <ZakatCalculator />
            </TabPanel>
            <TabPanel px={0}>
              <ZakatDistribution />
            </TabPanel>
          </TabPanels>
        </Tabs>
      </Container>
    </Layout>
  );
};

export default Zakat;