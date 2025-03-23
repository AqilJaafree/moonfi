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
  Code,
  Input,
  Link
} from '@chakra-ui/react';
import axios from 'axios';
import { ethers } from 'ethers';
import { useWeb3 } from '../../contexts/Web3Context';
import { getZakatContract, parseEther, formatEther } from '../../utils/contracts';

// API server endpoint
const API_URL = 'http://localhost:3001';

const ZakatCalculator: React.FC = () => {
  const { account, provider, isCorrectNetwork } = useWeb3();
  const [assetValue, setAssetValue] = useState('');
  const [zakatAmount, setZakatAmount] = useState('0');
  const [isCalculating, setIsCalculating] = useState(false);
  const [isContributing, setIsContributing] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [verifiedAssets, setVerifiedAssets] = useState<string>('0');
  const [contributions, setContributions] = useState<string>('0');
  const [verificationError, setVerificationError] = useState<string | null>(null);
  const [txHash, setTxHash] = useState<string>('');
  const [apiStatus, setApiStatus] = useState<'checking' | 'available' | 'unavailable'>('checking');
  const [proofResponse, setProofResponse] = useState<any>(null);
  const toast = useToast();
  
  const bgColor = useColorModeValue('white', 'gray.700');
  const nisabValue = ethers.utils.parseEther('3.0'); // Approximate Nisab value in ETH

  // Check API server availability
  useEffect(() => {
    const checkApiStatus = async () => {
      try {
        const response = await axios.get(`${API_URL}/status`);
        if (response.status === 200) {
          setApiStatus('available');
        } else {
          setApiStatus('unavailable');
        }
      } catch (error) {
        console.error('API server not available:', error);
        setApiStatus('unavailable');
      }
    };
    
    checkApiStatus();
  }, []);

  // Handle transaction hash input change
  const handleTxHashChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTxHash(e.target.value);
  };

  // Fill with sample transaction hash
  const fillSampleTxHash = () => {
    setTxHash('0x8a7fc50330533cd0adbf71e1cfb51b1b6bbe2170b4ce65c02678cf08c8b17737');
  };

  // Manually update verified assets (for development/testing)
  const updateVerifiedAssets = async () => {
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

    // For demonstration purposes - directly update the UI state
    setVerifiedAssets(assetValue);
    
    toast({
      title: 'Assets updated (UI only)',
      description: 'This is a UI update only. In a real implementation, the contract state would be updated.',
      status: 'info',
      duration: 5000,
      isClosable: true,
    });
  };

  // Verify assets with the Brevis API server
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

    if (apiStatus !== 'available') {
      toast({
        title: 'API server unavailable',
        description: 'The Brevis API server is not available. Please ensure it is running.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
      return;
    }

    setIsVerifying(true);
    setVerificationError(null);
    setProofResponse(null);
    
    try {
      toast({
        title: 'Generating proof',
        description: 'Connecting to Zakat prover service...',
        status: 'info',
        duration: 3000,
        isClosable: true,
      });
      
      // Call the API server to generate a proof
      const response = await axios.post(`${API_URL}/api/zakat/generate-proof`, {
        txHash: txHash
      });
      
      if (response.data.success) {
        // Store the proof response for debugging
        setProofResponse(response.data);
        
        toast({
          title: 'Proof generated',
          description: 'Proof was successfully generated by the prover. For demonstration purposes, we will update your verified assets in the UI.',
          status: 'success',
          duration: 5000,
          isClosable: true,
        });
        
        // For demonstration purposes only - update the UI state
        if (assetValue && parseFloat(assetValue) > 0) {
          setVerifiedAssets(assetValue);
        }
      } else {
        throw new Error(response.data.error || 'Verification failed');
      }
    } catch (error: any) {
      console.error('Verification error:', error);
      setVerificationError(error.response?.data?.error || error.message || 'Unknown error');
      
      toast({
        title: 'Verification failed',
        description: error.response?.data?.error || error.message || 'An error occurred during verification',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsVerifying(false);
    }
  };

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

  // Contribute Zakat
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

    if (parseFloat(verifiedAssets) <= 0) {
      toast({
        title: 'Assets not verified',
        description: 'You need to verify your assets before contributing Zakat',
        status: 'warning',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    setIsContributing(true);
    try {
      const zakatContract = getZakatContract(provider);
      const tx = await zakatContract.contributeZakat({
        value: parseEther(zakatAmount)
      });
      
      toast({
        title: 'Transaction sent',
        description: 'Your Zakat contribution is being processed',
        status: 'info',
        duration: 5000,
        isClosable: true,
      });
      
      await tx.wait();
      
      toast({
        title: 'Zakat contributed',
        description: 'Your Zakat has been successfully contributed',
        status: 'success',
        duration: 5000,
        isClosable: true,
      });
      
      // Reset form
      setAssetValue('');
      setZakatAmount('0');
      
      // Refresh user data
      fetchUserData();
    } catch (error: any) {
      console.error('Contribution error:', error);
      toast({
        title: 'Contribution failed',
        description: error.message || 'An error occurred during the contribution',
        status: 'error',
        duration: 5000,
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
        <Text>
          Calculate and contribute your Zakat (2.5% of eligible assets) securely through our Shariah-compliant platform.
        </Text>
        
        {!account && (
          <Alert status="warning">
            <AlertIcon />
            <AlertDescription>Please connect your wallet to use the Zakat calculator</AlertDescription>
          </Alert>
        )}

        {account && !isCorrectNetwork && (
          <Alert status="warning">
            <AlertIcon />
            <AlertDescription>Please switch to Sepolia network</AlertDescription>
          </Alert>
        )}

        {apiStatus === 'unavailable' && (
          <Alert status="error">
            <AlertIcon />
            <AlertDescription>
              The Brevis API server is not available. Please ensure it is running on {API_URL}.
            </AlertDescription>
          </Alert>
        )}

        {account && isCorrectNetwork && (
          <>
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

            <Divider />

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

            <Flex gap={2}>
              <Button
                colorScheme="blue"
                onClick={calculateZakat}
                isLoading={isCalculating}
                loadingText="Calculating..."
                isDisabled={!assetValue || parseFloat(assetValue) <= 0}
                flex={1}
              >
                Calculate Zakat
              </Button>
              
              <Button
                colorScheme="purple"
                onClick={updateVerifiedAssets}
                isDisabled={!assetValue || parseFloat(assetValue) <= 0}
                flex={1}
              >
                Update Assets (Demo)
              </Button>
            </Flex>

            <Divider />

            {/* Transaction Hash Input for Verification */}
            <FormControl id="txHash">
              <FormLabel>Transaction Hash for Verification</FormLabel>
              <Flex gap={2}>
                <Input
                  value={txHash}
                  onChange={handleTxHashChange}
                  placeholder="Enter a transaction hash containing your asset information"
                />
                <Button size="sm" onClick={fillSampleTxHash}>
                  Sample
                </Button>
              </Flex>
              <Text fontSize="xs" color="gray.500" mt={1}>
                Enter a transaction hash that contains your asset information
              </Text>
            </FormControl>

            <Button
              colorScheme="teal"
              onClick={verifyAssets}
              isLoading={isVerifying}
              loadingText="Verifying..."
              isDisabled={!txHash || apiStatus !== 'available'}
            >
              Verify Assets
            </Button>
            
            {verificationError && (
              <Alert status="error">
                <AlertIcon />
                <Flex direction="column">
                  <AlertDescription>Verification failed</AlertDescription>
                  <Code mt={2} fontSize="xs">{verificationError}</Code>
                </Flex>
              </Alert>
            )}
            
            {proofResponse && (
              <Alert status="info" variant="subtle">
                <AlertIcon />
                <Flex direction="column">
                  <AlertDescription fontWeight="bold">Proof Generated</AlertDescription>
                  <Text fontSize="sm" mt={2}>
                    A proof was successfully generated. This proof would normally be submitted to the blockchain.
                  </Text>
                  <Text fontSize="xs" mt={2}>
                    Proof details: {JSON.stringify(proofResponse.proofData, null, 2)}
                  </Text>
                </Flex>
              </Alert>
            )}

            {parseFloat(zakatAmount) > 0 && (
              <Box p={4} borderWidth={1} borderRadius="md" bg="blue.50">
                <Stat>
                  <StatLabel>Your Zakat Amount (2.5%)</StatLabel>
                  <StatNumber>{zakatAmount} ETH</StatNumber>
                  <StatHelpText>This is the amount you should contribute</StatHelpText>
                </Stat>

                <Button
                  mt={4}
                  colorScheme="green"
                  onClick={contributeZakat}
                  isLoading={isContributing}
                  loadingText="Contributing..."
                  width="full"
                  isDisabled={parseFloat(verifiedAssets) <= 0}
                >
                  Contribute Zakat Now
                </Button>

                {parseFloat(verifiedAssets) <= 0 && (
                  <Alert status="info" mt={2}>
                    <AlertIcon />
                    <AlertDescription>You need to verify your assets before contributing</AlertDescription>
                  </Alert>
                )}
              </Box>
            )}
          </>
        )}
      </Flex>
    </Box>
  );
};

export default ZakatCalculator;