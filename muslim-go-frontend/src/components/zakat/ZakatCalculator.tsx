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
  Spinner,
  Progress
} from '@chakra-ui/react';
import { ethers } from 'ethers';
import { useWeb3 } from '../../contexts/Web3Context';
import { getZakatContract, parseEther, formatEther } from '../../utils/contracts';
import { brevisService } from '../../utils/brevisService';

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
  const [proversStatus, setProversStatus] = useState<{zakatService: boolean, premiumService: boolean}>({
    zakatService: false,
    premiumService: false
  });
  const [isCheckingProvers, setIsCheckingProvers] = useState(true);
  const [proofResponse, setProofResponse] = useState<any>(null);
  const [verificationProgress, setVerificationProgress] = useState(0);
  const [isCheckingProofStatus, setIsCheckingProofStatus] = useState(false);
  const [isProofVerified, setIsProofVerified] = useState(false);
  const toast = useToast();
  
  const bgColor = useColorModeValue('white', 'gray.700');
  const nisabValue = ethers.utils.parseEther('3.0'); // Approximate Nisab value in ETH

  // Check prover services availability
  useEffect(() => {
    const checkProvers = async () => {
      setIsCheckingProvers(true);
      try {
        const status = await brevisService.checkProverServices();
        setProversStatus(status);
      } catch (error) {
        console.error('Failed to check prover services:', error);
        setProversStatus({ zakatService: false, premiumService: false });
      } finally {
        setIsCheckingProvers(false);
      }
    };
    
    checkProvers();
    
    // Check every 30 seconds
    const interval = setInterval(checkProvers, 30000);
    
    return () => clearInterval(interval);
  }, []);

  // Handle transaction hash input change
  const handleTxHashChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTxHash(e.target.value);
    // Reset verification status when hash changes
    setIsProofVerified(false);
    setProofResponse(null);
  };

  // Fill with sample transaction hash
  const fillSampleTxHash = () => {
    setTxHash(brevisService.getSampleTransactionHash());
    // Reset verification status
    setIsProofVerified(false);
    setProofResponse(null);
  };

  // Verify assets with the Brevis prover service and submit to Brevis network
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

    if (!proversStatus.zakatService) {
      toast({
        title: 'Zakat prover unavailable',
        description: 'The Zakat prover service is not available. Please ensure it is running.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
      return;
    }

    setIsVerifying(true);
    setVerificationError(null);
    setProofResponse(null);
    setVerificationProgress(10);
    
    try {
      toast({
        title: 'Generating proof',
        description: 'Connecting to Zakat prover service...',
        status: 'info',
        duration: 3000,
        isClosable: true,
      });
      
      // Call the prover service with the user's address for callbacks
      const result = await brevisService.generateZakatProof(txHash, account);
      
      if (result.success) {
        setVerificationProgress(70);
        // Store the proof response
        setProofResponse(result);
        
        toast({
          title: 'Proof verified',
          description: 'The proof was successfully generated and verified on the Brevis network.',
          status: 'success',
          duration: 5000,
          isClosable: true,
        });
        
        // Set proof as verified
        setIsProofVerified(true);
        setVerificationProgress(100);
        
        // For demonstration purposes only - update the UI state based on asset value
        if (assetValue && parseFloat(assetValue) > 0) {
          setVerifiedAssets(assetValue);
        }
        
        // Refresh user data from contract
        await fetchUserData();
      } else {
        throw new Error(result.error || 'Verification failed');
      }
    } catch (error: any) {
      console.error('Verification error:', error);
      setVerificationError(error.message || 'Unknown error');
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

    if (!isProofVerified || parseFloat(verifiedAssets) <= 0) {
      toast({
        title: 'Assets not verified',
        description: 'You need to verify your assets with the Brevis network before contributing Zakat',
        status: 'warning',
        duration: 4000,
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

        {isCheckingProvers ? (
          <Flex justify="center" align="center" p={4}>
            <Spinner size="sm" mr={2} />
            <Text>Checking prover services...</Text>
          </Flex>
        ) : !proversStatus.zakatService ? (
          <Alert status="error">
            <AlertIcon />
            <AlertDescription>
              The Zakat prover service is not available. Please ensure it is running on port 33257.
            </AlertDescription>
          </Alert>
        ) : (
          <Alert status="success" variant="subtle">
            <AlertIcon />
            <AlertDescription>
              Zakat prover service is online and ready to verify transactions.
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

            <Divider />

            {/* Transaction Hash Input for Verification */}
            <FormControl id="txHash" mb={4}>
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
              isDisabled={!txHash || !proversStatus.zakatService}
              width="full"
              mb={4}
            >
              Verify Assets with Brevis
            </Button>
            
            {isVerifying && (
              <Box mb={4}>
                <Text fontSize="sm" mb={2}>Verification progress:</Text>
                <Progress value={verificationProgress} colorScheme="teal" size="sm" borderRadius="md" />
                <Text fontSize="xs" textAlign="right" mt={1}>
                  {verificationProgress < 30 ? "Generating proof..." : 
                   verificationProgress < 70 ? "Submitting to Brevis network..." : 
                   verificationProgress < 100 ? "Waiting for on-chain verification..." : 
                   "Verification complete!"}
                </Text>
              </Box>
            )}
            
            {verificationError && (
              <Alert status="error" mb={4}>
                <AlertIcon />
                <Flex direction="column">
                  <AlertDescription>Verification failed</AlertDescription>
                  <Code mt={2} fontSize="xs">{verificationError}</Code>
                </Flex>
              </Alert>
            )}
            
            {isProofVerified && (
              <Alert status="success" mb={4}>
                <AlertIcon />
                <Flex direction="column">
                  <AlertDescription>Assets successfully verified on-chain</AlertDescription>
                  <Text fontSize="sm" mt={2}>
                    Your assets have been verified through the Brevis network and are now ready for Zakat contribution.
                  </Text>
                </Flex>
              </Alert>
            )}
            
            {proofResponse && !isProofVerified && (
              <Alert status="info" variant="subtle" mb={4}>
                <AlertIcon />
                <Flex direction="column">
                  <AlertDescription fontWeight="bold">Proof Generated</AlertDescription>
                  <Text fontSize="sm" mt={2}>
                    A proof was generated, but on-chain verification is not yet complete.
                  </Text>
                  <Text fontSize="xs" mt={2}>
                    Query key: {proofResponse.queryKey || "N/A"}
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
                  isDisabled={!isProofVerified || parseFloat(verifiedAssets) <= 0}
                >
                  Contribute Zakat Now
                </Button>

                {!isProofVerified && (
                  <Alert status="info" mt={2}>
                    <AlertIcon />
                    <AlertDescription>You need to verify your assets with the Brevis network before contributing</AlertDescription>
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