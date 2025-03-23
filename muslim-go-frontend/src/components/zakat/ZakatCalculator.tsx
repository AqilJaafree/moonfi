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
  const { account, provider, isCorrectNetwork } = useWeb3();
  const [assetValue, setAssetValue] = useState('');
  const [zakatAmount, setZakatAmount] = useState('0');
  const [isCalculating, setIsCalculating] = useState(false);
  const [isContributing, setIsContributing] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [verifiedAssets, setVerifiedAssets] = useState<string>('0');
  const [contributions, setContributions] = useState<string>('0');
  const [txHash, setTxHash] = useState<string>('');
  const [proversStatus, setProversStatus] = useState<{zakatService: boolean, premiumService: boolean}>({
    zakatService: false,
    premiumService: false
  });
  const [isCheckingProvers, setIsCheckingProvers] = useState(true);
  const [proofResponse, setProofResponse] = useState<any>(null);
  const [isCheckingProofStatus, setIsCheckingProofStatus] = useState(false);
  const [verificationStatus, setVerificationStatus] = useState<string>('');
  const [verificationProgress, setVerificationProgress] = useState(0);
  const [statusMessage, setStatusMessage] = useState<string>('');
  const [detailedStatus, setDetailedStatus] = useState<any>(null);
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

  // Check proof status if we have a queryKey
  useEffect(() => {
    if (!proofResponse?.queryKey || verificationStatus === 'verified') return;
    
    const checkProofStatus = async () => {
      setIsCheckingProofStatus(true);
      try {
        const result = await brevisService.checkProofStatus(proofResponse.queryKey);
        setDetailedStatus(result);
        
        if (result.success) {
          setVerificationStatus(result.status);
          setStatusMessage(result.message || '');
          
          if (result.status === 'verified') {
            setVerificationProgress(100);
            toast({
              title: 'Verification complete',
              description: 'Your assets have been verified on-chain',
              status: 'success',
              duration: 5000,
              isClosable: true,
            });
            
            // Now that we're verified on-chain, refresh the user data
            await fetchUserData();
          } else if (result.status === 'pending') {
            setVerificationProgress(70);
          } else {
            setVerificationProgress(50);
          }
        } else {
          console.error('Error checking status:', result.error);
        }
      } catch (error) {
        console.error('Error checking proof status:', error);
      } finally {
        setIsCheckingProofStatus(false);
      }
    };
    
    checkProofStatus();
    
    // Check status every 5 seconds
    const interval = setInterval(checkProofStatus, 5000);
    
    return () => clearInterval(interval);
  }, [proofResponse, verificationStatus]);

  // Handle transaction hash input change
  const handleTxHashChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTxHash(e.target.value);
    // Reset verification when hash changes
    setProofResponse(null);
    setVerificationStatus('');
    setVerificationProgress(0);
    setStatusMessage('');
    setDetailedStatus(null);
  };

  // Fill with sample transaction hash
  const fillSampleTxHash = () => {
    setTxHash(brevisService.getSampleTransactionHash());
    // Reset verification for new hash
    setProofResponse(null);
    setVerificationStatus('');
    setVerificationProgress(0);
    setStatusMessage('');
    setDetailedStatus(null);
  };

  // Verify assets with the Brevis service
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
    setVerificationProgress(10);
    setProofResponse(null);
    setVerificationStatus('');
    setStatusMessage('');
    setDetailedStatus(null);
    
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
        setProofResponse(result);
        setVerificationProgress(50);
        setVerificationStatus('pending');
        
        // Check if this is a simulated response
        if (result.simulated) {
          setStatusMessage('Simulated verification in progress');
          toast({
            title: 'Simulation active',
            description: 'Using simulation mode for verification (Brevis network bypassed)',
            status: 'info',
            duration: 5000,
            isClosable: true,
          });
        } else {
          setStatusMessage('Proof submitted to Brevis network');
          toast({
            title: 'Proof generated',
            description: 'The proof has been submitted to the Brevis network for verification',
            status: 'info',
            duration: 5000,
            isClosable: true,
          });
        }
        
        // For demonstration purposes only - update the UI state based on asset value
        if (assetValue && parseFloat(assetValue) > 0) {
          // This is just for visual confirmation while waiting for on-chain verification
          // The real value will be updated when we fetchUserData() after verification
          setVerifiedAssets(assetValue);
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

    setIsContributing(true);
    try {
      const zakatContract = getZakatContract(provider);
      
      // First, let's check if the assets are verified on-chain
      const verifiedAmount = await zakatContract.lastVerifiedAssets(account);
      console.log('Verified assets on chain:', formatEther(verifiedAmount));
      
      if (verifiedAmount.isZero()) {
        toast({
          title: 'Assets not verified on-chain',
          description: 'Your assets have not been verified on the blockchain yet. Please wait for the verification to complete.',
          status: 'warning',
          duration: 5000,
          isClosable: true,
        });
        setIsContributing(false);
        return;
      }
      
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
      console.log('Verified assets from contract:', formatEther(assets));
      
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

  return ( <Box bg={bgColor} p={6} borderRadius="lg" boxShadow="base">
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
            The Zakat prover service is not available. Please ensure it is running on port 33247.
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
            isDisabled={!txHash || !proversStatus.zakatService || isCheckingProofStatus}
            width="full"
            mb={4}
          >
            Verify Assets with Brevis
          </Button>
          
          {(isVerifying || verificationProgress > 0) && (
            <Box mb={4}>
              <Text fontSize="sm" mb={2}>Verification progress:</Text>
              <Progress value={verificationProgress} colorScheme="teal" size="sm" borderRadius="md" />
              <Text fontSize="xs" textAlign="right" mt={1}>
                {verificationProgress < 30 ? "Generating proof..." : 
                 verificationProgress < 70 ? "Waiting for Brevis network verification..." : 
                 verificationProgress < 100 ? "Waiting for on-chain verification..." : 
                 "Verification complete!"}
              </Text>
              {statusMessage && (
                <Text fontSize="xs" mt={2} color="gray.600">{statusMessage}</Text>
              )}
            </Box>
          )}
          
          {isCheckingProofStatus && (
            <Alert status="info" mb={4}>
              <AlertIcon />
              <Flex direction="column">
                <AlertDescription>Checking verification status...</AlertDescription>
                <Text fontSize="sm" mt={2}>
                  {detailedStatus?.simulated 
                    ? "Using simulation mode for demo purposes" 
                    : "This may take a few minutes. The Brevis network is verifying your proof and updating your on-chain data."}
                </Text>
              </Flex>
            </Alert>
          )}
          
          {verificationStatus === 'verified' && (
            <Alert status="success" mb={4}>
              <AlertIcon />
              <Flex direction="column">
                <AlertDescription>Assets successfully verified on-chain</AlertDescription>
                <Text fontSize="sm" mt={2}>
                  Your assets have been verified through the Brevis network and are now ready for Zakat contribution.
                </Text>
                {detailedStatus?.tx && (
                  <Text fontSize="xs" mt={2}>
                    Transaction: {detailedStatus.tx.substring(0, 20)}...
                  </Text>
                )}
              </Flex>
            </Alert>
          )}
          
          {verificationStatus === 'failed' && (
            <Alert status="error" mb={4}>
              <AlertIcon />
              <Flex direction="column">
                <AlertDescription>Verification failed</AlertDescription>
                <Text fontSize="sm" mt={2}>
                  The verification process could not be completed. Please try again with a different transaction hash.
                </Text>
              </Flex>
            </Alert>
          )}
          
          {proofResponse && verificationStatus === 'pending' && (
            <Alert status="info" variant="subtle" mb={4}>
              <AlertIcon />
              <Flex direction="column">
                <AlertDescription fontWeight="bold">Verification in progress</AlertDescription>
                <Text fontSize="sm" mt={2}>
                  Your asset verification has been submitted and is being processed by the Brevis network.
                </Text>
                {proofResponse.queryKey && (
                  <Code fontSize="xs" mt={2}>
                    Query hash: {proofResponse.queryKey.query_hash.substring(0, 12)}...
                    Nonce: {proofResponse.queryKey.nonce}
                  </Code>
                )}
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
                isDisabled={parseFloat(verifiedAssets) <= 0 || verificationStatus !== 'verified'}
              >
                Contribute Zakat Now
              </Button>

              {(parseFloat(verifiedAssets) <= 0 || verificationStatus !== 'verified') && (
                <Alert status="info" mt={2}>
                  <AlertIcon />
                  <AlertDescription>
                    {verificationStatus === 'pending' 
                      ? "Please wait for the on-chain verification to complete before contributing"
                      : "You need to verify your assets with the Brevis network before contributing"}
                  </AlertDescription>
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