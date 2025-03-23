import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  FormControl,
  FormLabel,
  Flex,
  Text,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  Heading,
  Divider,
  useColorModeValue,
  NumberInput,
  NumberInputField,
  useToast,
  Alert,
  AlertIcon,
  AlertDescription,
  Spinner,
  Input,
  Progress,
  Code
} from '@chakra-ui/react';
import { ethers } from 'ethers';
import { useWeb3 } from '../../contexts/Web3Context';
import { getZakatContract, parseEther, formatEther } from '../../utils/contracts';
import { brevisService } from '../../utils/brevisService';

const ZakatCalculator: React.FC = () => {
  // Web3 context and state management
  const { account, provider, isCorrectNetwork } = useWeb3();
  
  // State for asset and Zakat calculations
  const [assetValue, setAssetValue] = useState('');
  const [zakatAmount, setZakatAmount] = useState('0');
  
  // Loading states for different actions
  const [isCalculating, setIsCalculating] = useState(false);
  const [isContributing, setIsContributing] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  
  // User's verified assets and contributions
  const [verifiedAssets, setVerifiedAssets] = useState<string>('0');
  const [contributions, setContributions] = useState<string>('0');
  
  // Transaction hash for verification
  const [txHash, setTxHash] = useState<string>('');
  
  // Proof verification states
  const [proofResponse, setProofResponse] = useState<any>(null);
  const [verificationStatus, setVerificationStatus] = useState<string>('');
  const [verificationProgress, setVerificationProgress] = useState(0);

  // Chakra UI theming
  const bgColor = useColorModeValue('white', 'gray.700');
  
  // Nisab threshold (minimum assets required for Zakat)
  const nisabValue = ethers.utils.parseEther('3.0');

  // Toast for notifications
  const toast = useToast();

  // Calculate Zakat amount (2.5% of asset value)
  const calculateZakat = () => {
    if (!assetValue || parseFloat(assetValue) <= 0) {
      toast({
        title: 'Invalid amount',
        description: 'Please enter a valid asset value',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    setIsCalculating(true);
    try {
      const valueInWei = parseEther(assetValue);
      
      // Check if assets exceed Nisab
      if (valueInWei.lt(nisabValue)) {
        toast({
          title: 'Below Nisab',
          description: 'Your assets do not reach the Nisab threshold for Zakat',
          status: 'info',
          duration: 5000,
          isClosable: true,
        });
        setZakatAmount('0');
      } else {
        // Calculate 2.5% of asset value
        const zakatInWei = valueInWei.mul(25).div(1000);
        setZakatAmount(formatEther(zakatInWei));
      }
    } catch (error) {
      console.error('Calculation error:', error);
      toast({
        title: 'Calculation error',
        description: 'An error occurred during calculation',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setIsCalculating(false);
    }
  };

  // Verify assets with Brevis service
  const verifyAssets = async () => {
    if (!provider || !account || !isCorrectNetwork) {
      toast({
        title: 'Connection error',
        description: 'Please connect your wallet to Sepolia network',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    if (!txHash || txHash.trim() === '') {
      toast({
        title: 'Missing transaction hash',
        description: 'Please enter a valid transaction hash for verification',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    setIsVerifying(true);
    setVerificationProgress(10);
    setProofResponse(null);
    setVerificationStatus('');
    
    try {
      const result = await brevisService.generateZakatProof(txHash, account);
      
      if (result.success) {
        setProofResponse(result);
        setVerificationProgress(50);
        setVerificationStatus('pending');
        
        toast({
          title: 'Proof generated',
          description: 'The proof has been submitted to the verification service',
          status: 'info',
          duration: 5000,
          isClosable: true,
        });
        
        // For demonstration, update UI based on asset value
        if (assetValue && parseFloat(assetValue) > 0) {
          setVerifiedAssets(assetValue);
          setVerificationStatus('verified'); // Simulate verification
        }
      } else {
        throw new Error(result.error || 'Verification failed');
      }
    } catch (error: any) {
      console.error('Verification error:', error);
      setVerificationProgress(0);
      
      toast({
        title: 'Verification failed',
        description: error.message || 'An error occurred during verification',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsVerifying(false);
    }
  };

  // Contribute Zakat (Real Contribution)
  const contributeZakat = async () => {
    if (!provider || !account || !isCorrectNetwork) {
      toast({
        title: 'Connection error',
        description: 'Please connect your wallet to Sepolia network',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    if (parseFloat(zakatAmount) <= 0) {
      toast({
        title: 'Invalid amount',
        description: 'Please calculate your Zakat amount first',
        status: 'warning',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    setIsContributing(true);
    try {
      const zakatContract = getZakatContract(provider);
      
      // Check if assets are verified on-chain
      const verifiedAmount = await zakatContract.lastVerifiedAssets(account);
      console.log('Verification Status:', {
        verificationStatus,
        verifiedAssets,
        onChainVerifiedAmount: formatEther(verifiedAmount)
      });
      
      if (verifiedAmount.isZero()) {
        toast({
          title: 'Assets not verified',
          description: 'Your assets have not been verified on the blockchain',
          status: 'warning',
          duration: 5000,
          isClosable: true,
        });
        setIsContributing(false);
        return;
      }
      
      // Contribute Zakat
      const tx = await zakatContract.contributeZakat({
        value: parseEther(zakatAmount)
      });
      
      toast({
        title: 'Zakat contributed',
        description: `${zakatAmount} ETH contributed successfully`,
        status: 'success',
        duration: 5000,
        isClosable: true,
      });
      
      // Reset form and refresh data
      setAssetValue('');
      setZakatAmount('0');
      await fetchUserData();
    } catch (error: any) {
      console.error('Contribution error:', error);
      toast({
        title: 'Contribution failed',
        description: error.message || 'An error occurred',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsContributing(false);
    }
  };

  // Mock Zakat Contribution
  const mockContributeZakat = async () => {
    // Simulate contribution process
    setIsContributing(true);
    
    try {
      // Simulate a successful contribution
      await new Promise(resolve => setTimeout(resolve, 1500)); // Simulate network delay
      
      // Update mock contribution state
      const mockContributionAmount = parseFloat(zakatAmount);
      const currentContributions = parseFloat(contributions || '0');
      const newTotalContributions = (currentContributions + mockContributionAmount).toFixed(4);
      
      setContributions(newTotalContributions);
      
      // Show success toast
      toast({
        title: 'Mock Zakat Contribution',
        description: `Successfully contributed ${zakatAmount} ETH (Simulated)`,
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
      
      // Reset form
      setAssetValue('');
      setZakatAmount('0');
    } catch (error) {
      // Handle any unexpected errors
      toast({
        title: 'Mock Contribution Error',
        description: 'An error occurred during simulated contribution',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setIsContributing(false);
    }
  };

  // Fetch user's data from the contract
  const fetchUserData = async () => {
    if (!provider || !account || !isCorrectNetwork) return;
    
    try {
      const zakatContract = getZakatContract(provider);
      
      // Get verified assets
      const assets = await zakatContract.lastVerifiedAssets(account);
      setVerifiedAssets(formatEther(assets));
      
      // Get contributions
      const contributions = await zakatContract.zakatContributions(account);
      setContributions(formatEther(contributions));
    } catch (error) {
      console.error('Error fetching user data:', error);
    }
  };

  // Fetch user data when account or network changes
  useEffect(() => {
    fetchUserData();
  }, [account, isCorrectNetwork, provider]);

  return (
    <Box bg={bgColor} p={6} borderRadius="lg" boxShadow="base">
      <Flex direction="column" gap={6}>
        <Heading size="md">Zakat Calculator</Heading>
        
        {/* User Information */}
        <Box p={4} borderWidth={1} borderRadius="md">
          <Heading size="sm" mb={3}>Your Information</Heading>
          <Stat>
            <StatLabel>Verified Assets</StatLabel>
            <StatNumber>{verifiedAssets} ETH</StatNumber>
            <StatHelpText>Last verified value</StatHelpText>
          </Stat>
          <Stat mt={4}>
            <StatLabel>Total Contributions</StatLabel>
            <StatNumber>{contributions} ETH</StatNumber>
            <StatHelpText>Your Zakat contributions to date</StatHelpText>
          </Stat>
        </Box>

        {/* Asset Value Input */}
        <FormControl id="assetValue">
          <FormLabel>Your Assets Value (ETH)</FormLabel>
          <NumberInput min={0} precision={4}>
            <NumberInputField
              value={assetValue}
              onChange={(e) => setAssetValue(e.target.value)}
              placeholder="Enter your assets value in ETH"
            />
          </NumberInput>
        </FormControl>

        {/* Calculate Zakat Button */}
        <Button
          colorScheme="blue"
          onClick={calculateZakat}
          isLoading={isCalculating}
          loadingText="Calculating..."
          isDisabled={!assetValue || parseFloat(assetValue) <= 0}
          width="full"
        >
          Calculate Zakat
        </Button>

        {/* Transaction Hash Input */}
        <FormControl id="txHash" mb={4}>
          <FormLabel>Transaction Hash for Verification</FormLabel>
          <Flex gap={2}>
            <Input
              value={txHash}
              onChange={(e) => setTxHash(e.target.value)}
              placeholder="Enter transaction hash"
            />
            <Button size="sm" onClick={() => setTxHash(brevisService.getSampleTransactionHash())}>
              Sample
            </Button>
          </Flex>
        </FormControl>

        {/* Verify Assets Button */}
        <Button
          colorScheme="teal"
          onClick={verifyAssets}
          isLoading={isVerifying}
          loadingText="Verifying..."
          isDisabled={!txHash}
          width="full"
          mb={4}
        >
          Verify Assets with Brevis
        </Button>

        {/* Verification Progress */}
        {verificationProgress > 0 && (
          <Box mb={4}>
            <Progress value={verificationProgress} colorScheme="teal" size="sm" />
            <Text fontSize="xs" textAlign="right" mt={1}>
              {verificationStatus}
            </Text>
          </Box>
        )}

        {/* Zakat Contribution Section */}
        {parseFloat(zakatAmount) > 0 && (
          <Box p={4} borderWidth={1} borderRadius="md" bg="blue.50">
            <Stat>
              <StatLabel>Your Zakat Amount (2.5%)</StatLabel>
              <StatNumber>{zakatAmount} ETH</StatNumber>
              <StatHelpText>This is the amount you should contribute</StatHelpText>
            </Stat>

            <Flex gap={2} mt={4}>
              <Button
                flex={1}
                colorScheme="green"
                onClick={contributeZakat}
                isLoading={isContributing}
                loadingText="Contributing..."
                isDisabled={parseFloat(verifiedAssets) <= 0 || verificationStatus !== 'verified'}
              >
                Contribute Zakat (Real)
              </Button>
              <Button
                flex={1}
                colorScheme="purple"
                onClick={mockContributeZakat}
                isLoading={isContributing}
                loadingText="Simulating..."
              >
                Mock Contribution
              </Button>
            </Flex>
          </Box>
        )}
      </Flex>
    </Box>
  );
};

export default ZakatCalculator;