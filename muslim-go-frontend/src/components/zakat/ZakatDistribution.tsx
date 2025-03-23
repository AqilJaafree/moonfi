import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  FormControl,
  FormLabel,
  Input,
  VStack,
  Text,
  Heading,
  Divider,
  useColorModeValue,
  useToast,
  Alert,
  AlertIcon,
  AlertDescription,
  IconButton,
  Flex
} from '@chakra-ui/react';
import { AddIcon, DeleteIcon } from '@chakra-ui/icons';
import { ethers } from 'ethers';
import { useWeb3 } from '../../contexts/Web3Context';
import { getZakatContract, parseEther } from '../../utils/contracts';

interface CharityEntry {
  address: string;
  amount: string;
}

const ZakatDistribution: React.FC = () => {
  const { account, provider, isCorrectNetwork } = useWeb3();
  const [isOwner, setIsOwner] = useState(false);
  const [charities, setCharities] = useState<CharityEntry[]>([
    { address: '', amount: '' }
  ]);
  const [isDistributing, setIsDistributing] = useState(false);
  const toast = useToast();
  
  const bgColor = useColorModeValue('white', 'gray.700');

  // Check if connected account is the contract owner
  const checkOwnership = async () => {
    if (!provider || !account || !isCorrectNetwork) {
      setIsOwner(false);
      return;
    }
    
    try {
      const zakatContract = getZakatContract(provider);
      const owner = await zakatContract.owner();
      setIsOwner(owner.toLowerCase() === account.toLowerCase());
    } catch (error) {
      console.error('Error checking ownership:', error);
      setIsOwner(false);
    }
  };

  // Add another charity entry
  const addCharityField = () => {
    setCharities([...charities, { address: '', amount: '' }]);
  };

  // Remove a charity entry
  const removeCharityField = (index: number) => {
    const newCharities = [...charities];
    newCharities.splice(index, 1);
    setCharities(newCharities);
  };

  // Update charity entry data
  const updateCharity = (index: number, field: 'address' | 'amount', value: string) => {
    const newCharities = [...charities];
    newCharities[index][field] = value;
    setCharities(newCharities);
  };

  // Distribute Zakat to charities
  const distributeZakat = async () => {
    if (!provider || !account || !isCorrectNetwork || !isOwner) {
      toast({
        title: 'Permission denied',
        description: 'You must be the contract owner to distribute Zakat',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    // Validate inputs
    const invalidEntries = charities.some(
      (charity) => 
        !charity.address ||
        !ethers.utils.isAddress(charity.address) ||
        !charity.amount ||
        parseFloat(charity.amount) <= 0
    );

    if (invalidEntries) {
      toast({
        title: 'Invalid entries',
        description: 'Please check all charity addresses and amounts',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    setIsDistributing(true);
    try {
      const zakatContract = getZakatContract(provider);
      
      // Prepare arrays for contract call
      const addresses = charities.map(charity => charity.address);
      const amounts = charities.map(charity => parseEther(charity.amount));

      const tx = await zakatContract.distributeZakat(addresses, amounts);
      
      toast({
        title: 'Transaction sent',
        description: 'Zakat distribution is being processed',
        status: 'info',
        duration: 5000,
        isClosable: true,
      });
      
      await tx.wait();
      
      toast({
        title: 'Zakat distributed',
        description: 'Zakat has been successfully distributed to the specified charities',
        status: 'success',
        duration: 5000,
        isClosable: true,
      });
      
      // Reset form
      setCharities([{ address: '', amount: '' }]);
    } catch (error: any) {
      console.error('Distribution error:', error);
      toast({
        title: 'Distribution failed',
        description: error.message || 'An error occurred during the distribution',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsDistributing(false);
    }
  };

  // Check ownership when account or network changes
  useEffect(() => {
    checkOwnership();
  }, [account, isCorrectNetwork, provider]);

  if (!isOwner) {
    return (
      <Box bg={bgColor} p={6} borderRadius="lg" boxShadow="base">
        <Alert status="info">
          <AlertIcon />
          <AlertDescription>
            This section is only accessible to the contract owner who can distribute Zakat funds to charities.
          </AlertDescription>
        </Alert>
      </Box>
    );
  }

  return (
    <Box bg={bgColor} p={6} borderRadius="lg" boxShadow="base">
      <VStack spacing={6} align="stretch">
        <Heading size="md">Zakat Distribution</Heading>
        <Text>
          As the contract owner, you can distribute the accumulated Zakat funds to approved charitable organizations.
        </Text>
        
        <Divider />
        
        {charities.map((charity, index) => (
          <Flex key={index} gap={4} align="center">
            <FormControl id={`charity-address-${index}`}>
              <FormLabel>Charity Address</FormLabel>
              <Input
                value={charity.address}
                onChange={(e) => updateCharity(index, 'address', e.target.value)}
                placeholder="0x..."
              />
            </FormControl>
            
            <FormControl id={`charity-amount-${index}`}>
              <FormLabel>Amount (ETH)</FormLabel>
              <Input
                value={charity.amount}
                onChange={(e) => updateCharity(index, 'amount', e.target.value)}
                placeholder="Amount in ETH"
                type="number"
                step="0.01"
                min="0"
              />
            </FormControl>
            
            <IconButton
              aria-label="Remove charity"
              icon={<DeleteIcon />}
              onClick={() => removeCharityField(index)}
              colorScheme="red"
              variant="outline"
              isDisabled={charities.length === 1}
              alignSelf="flex-end"
              mt={8}
            />
          </Flex>
        ))}
        
        <Button leftIcon={<AddIcon />} onClick={addCharityField} variant="outline">
          Add Another Charity
        </Button>
        
        <Button
          mt={4}
          colorScheme="green"
          onClick={distributeZakat}
          isLoading={isDistributing}
          loadingText="Distributing..."
        >
          Distribute Zakat
        </Button>
      </VStack>
    </Box>
  );
};

export default ZakatDistribution;