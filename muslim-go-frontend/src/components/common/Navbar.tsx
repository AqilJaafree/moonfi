import React from 'react';
import { 
  Box, 
  Flex, 
  Button, 
  Text, 
  Heading,
  useColorModeValue
} from '@chakra-ui/react';
import { Link } from 'react-router-dom';
import { useWeb3 } from '../../contexts/Web3Context';

const Navbar: React.FC = () => {
  const { account, connectWallet, disconnectWallet, isConnecting, isCorrectNetwork, switchToSepolia } = useWeb3();
  const bg = useColorModeValue('white', 'gray.800');
  const color = useColorModeValue('green.600', 'green.300');

  const handleConnect = async () => {
    try {
      await connectWallet();
    } catch (error) {
      console.error("Connection error:", error);
    }
  };

  const handleSwitchNetwork = async () => {
    try {
      await switchToSepolia();
    } catch (error) {
      console.error("Network switch error:", error);
    }
  };

  return (
    <Box as="nav" bg={bg} boxShadow="md" py={4} px={6}>
      <Flex justify="space-between" align="center" maxW="1200px" mx="auto">
        <Link to="/">
          <Heading size="lg" color={color} fontWeight="bold">
            MuslimGo
          </Heading>
        </Link>

        <Flex gap={6}>
          <Link to="/zakat">
            <Text fontWeight="medium">Zakat</Text>
          </Link>
          <Link to="/hajj">
            <Text fontWeight="medium">Hajj</Text>
          </Link>
        </Flex>

        <Flex gap={3}>
          {!account ? (
            <Button 
              colorScheme="green" 
              onClick={handleConnect} 
              isLoading={isConnecting}
              loadingText="Connecting..."
            >
              Connect Wallet
            </Button>
          ) : !isCorrectNetwork ? (
            <Button 
              colorScheme="orange" 
              onClick={handleSwitchNetwork}
            >
              Switch to Sepolia
            </Button>
          ) : (
            <>
              <Text fontSize="sm">
                {account.substring(0, 6)}...{account.substring(account.length - 4)}
              </Text>
              <Button size="sm" onClick={disconnectWallet}>
                Disconnect
              </Button>
            </>
          )}
        </Flex>
      </Flex>
    </Box>
  );
};

export default Navbar;