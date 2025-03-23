import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  FormControl,
  FormLabel,
  Flex,
  Text,
  Heading,
  useColorModeValue,
  Progress,
  NumberInput,
  NumberInputField,
  useToast,
} from '@chakra-ui/react';
import { ethers } from 'ethers';
import { useWeb3 } from '../../contexts/Web3Context';
import { getHajjContract, parseEther, formatEther } from '../../utils/contracts';
import { brevisService } from '../../utils/brevisService';

interface AccountInfo {
  goal: ethers.BigNumber;
  balance: ethers.BigNumber;
  lastUpdateTime: ethers.BigNumber;
  isActive: boolean;
}

const HajjAccount: React.FC = () => {
  const { account, provider, isCorrectNetwork } = useWeb3();
  
  // Premium and Account States
  const [isPremiumUser, setIsPremiumUser] = useState(false);
  const [accountInfo, setAccountInfo] = useState<AccountInfo | null>(null);
  
  // Form Input States
  const [goalAmount, setGoalAmount] = useState('');
  const [depositAmount, setDepositAmount] = useState('');
  const [txHash, setTxHash] = useState('');
  
  // Loading States
  const [isCreating, setIsCreating] = useState(false);
  const [isDepositing, setIsDepositing] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  
  const toast = useToast();
  const bgColor = useColorModeValue('white', 'gray.700');

  // Get Safe Provider
  const getProvider = () => {
    if (!provider) {
      throw new Error('Provider not available');
    }
    return provider;
  };

  // Verify Premium Status
  const checkPremiumStatus = async () => {
    try {
      if (!account || !isCorrectNetwork) {
        setIsPremiumUser(false);
        return;
      }
      
      const safeProvider = getProvider();
      const hajjContract = getHajjContract(safeProvider);
      const status = await hajjContract.verifiedPremiumUsers(account);
      setIsPremiumUser(status);
    } catch (error) {
      console.error('Error checking premium status:', error);
      setIsPremiumUser(false);
    }
  };

  // Verify Premium User via Brevis
  const verifyPremiumStatus = async () => {
    try {
      if (!account || !isCorrectNetwork) {
        toast({
          title: 'Connection Error',
          description: 'Please connect wallet to Sepolia network',
          status: 'error',
          duration: 3000,
        });
        return;
      }

      if (!txHash) {
        toast({
          title: 'Missing Transaction',
          description: 'Please enter a transaction hash',
          status: 'error',
          duration: 3000,
        });
        return;
      }

      setIsVerifying(true);
      
      const result = await brevisService.generatePremiumProof(txHash, account);
      
      if (result.success) {
        // Simulate verification for demo
        setIsPremiumUser(true);
        
        toast({
          title: 'Premium Verification',
          description: 'Successfully verified premium status',
          status: 'success',
          duration: 3000,
        });
      } else {
        throw new Error(result.error || 'Verification failed');
      }
    } catch (error: any) {
      console.error('Verification error:', error);
      
      toast({
        title: 'Verification Failed',
        description: error.message || 'Could not verify premium status',
        status: 'error',
        duration: 3000,
      });
    } finally {
      setIsVerifying(false);
    }
  };

  // Create Hajj Savings Account
  const createAccount = async () => {
    if (!isPremiumUser) {
      toast({
        title: 'Premium Required',
        description: 'You need to be a verified premium user',
        status: 'warning',
        duration: 3000,
      });
      return;
    }

    if (!goalAmount || parseFloat(goalAmount) <= 0) {
      toast({
        title: 'Invalid Goal',
        description: 'Please enter a valid savings goal',
        status: 'error',
        duration: 3000,
      });
      return;
    }

    setIsCreating(true);
    try {
      const safeProvider = getProvider();
      const hajjContract = getHajjContract(safeProvider);
      const tx = await hajjContract.createAccount(parseEther(goalAmount));
      
      toast({
        title: 'Account Created',
        description: 'Your Hajj savings account is being set up',
        status: 'success',
        duration: 3000,
      });
      
      await tx.wait();
      await fetchAccountInfo();
    } catch (error: any) {
      console.error('Account creation error:', error);
      toast({
        title: 'Creation Failed',
        description: error.message || 'Could not create account',
        status: 'error',
        duration: 3000,
      });
    } finally {
      setIsCreating(false);
    }
  };

  // Mock Create Account
  const mockCreateAccount = async () => {
    if (!isPremiumUser) {
      toast({
        title: 'Premium Required',
        description: 'You need to be a verified premium user',
        status: 'warning',
        duration: 3000,
      });
      return;
    }

    if (!goalAmount || parseFloat(goalAmount) <= 0) {
      toast({
        title: 'Invalid Goal',
        description: 'Please enter a valid savings goal',
        status: 'error',
        duration: 3000,
      });
      return;
    }

    setIsCreating(true);
    try {
      // Simulate account creation
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Mock account info
      setAccountInfo({
        goal: ethers.utils.parseEther(goalAmount),
        balance: ethers.utils.parseEther('0'),
        lastUpdateTime: ethers.BigNumber.from(Date.now()),
        isActive: true
      });
      
      toast({
        title: 'Mock Account Created',
        description: `Hajj savings account created with goal ${goalAmount} ETH`,
        status: 'success',
        duration: 3000,
      });
    } catch (error) {
      console.error('Mock account creation error:', error);
      toast({
        title: 'Mock Creation Failed',
        description: 'Could not create mock account',
        status: 'error',
        duration: 3000,
      });
    } finally {
      setIsCreating(false);
    }
  };

  // Deposit to Hajj Account
  const deposit = async () => {
    if (!accountInfo?.isActive) {
      toast({
        title: 'No Active Account',
        description: 'Create a Hajj savings account first',
        status: 'warning',
        duration: 3000,
      });
      return;
    }

    if (!depositAmount || parseFloat(depositAmount) <= 0) {
      toast({
        title: 'Invalid Amount',
        description: 'Please enter a valid deposit amount',
        status: 'error',
        duration: 3000,
      });
      return;
    }

    setIsDepositing(true);
    try {
      const safeProvider = getProvider();
      const hajjContract = getHajjContract(safeProvider);
      const tx = await hajjContract.deposit({
        value: parseEther(depositAmount)
      });
      
      toast({
        title: 'Deposit Successful',
        description: `Deposited ${depositAmount} ETH to Hajj savings`,
        status: 'success',
        duration: 3000,
      });
      
      await tx.wait();
      await fetchAccountInfo();
      setDepositAmount('');
    } catch (error: any) {
      console.error('Deposit error:', error);
      toast({
        title: 'Deposit Failed',
        description: error.message || 'Could not deposit funds',
        status: 'error',
        duration: 3000,
      });
    } finally {
      setIsDepositing(false);
    }
  };

  // Mock Deposit
  const mockDeposit = async () => {
    if (!accountInfo?.isActive) {
      toast({
        title: 'No Active Account',
        description: 'Create a Hajj savings account first',
        status: 'warning',
        duration: 3000,
      });
      return;
    }

    if (!depositAmount || parseFloat(depositAmount) <= 0) {
      toast({
        title: 'Invalid Amount',
        description: 'Please enter a valid deposit amount',
        status: 'error',
        duration: 3000,
      });
      return;
    }

    setIsDepositing(true);
    try {
      // Simulate deposit
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Update mock account balance
      const currentBalance = accountInfo.balance;
      const depositWei = parseEther(depositAmount);
      const newBalance = currentBalance.add(depositWei);
      
      setAccountInfo({
        ...accountInfo,
        balance: newBalance,
        lastUpdateTime: ethers.BigNumber.from(Date.now())
      });
      
      toast({
        title: 'Mock Deposit',
        description: `Deposited ${depositAmount} ETH to Hajj savings`,
        status: 'success',
        duration: 3000,
      });
      
      setDepositAmount('');
    } catch (error) {
      console.error('Mock deposit error:', error);
      toast({
        title: 'Mock Deposit Failed',
        description: 'Could not simulate deposit',
        status: 'error',
        duration: 3000,
      });
    } finally {
      setIsDepositing(false);
    }
  };

  // Fetch Account Information
  const fetchAccountInfo = async () => {
    if (!account || !isCorrectNetwork) {
      setAccountInfo(null);
      return;
    }
    
    try {
      const safeProvider = getProvider();
      const hajjContract = getHajjContract(safeProvider);
      const info = await hajjContract.accounts(account);
      setAccountInfo({
        goal: info.goal,
        balance: info.balance,
        lastUpdateTime: info.lastUpdateTime,
        isActive: info.isActive
      });
    } catch (error) {
      console.error('Error fetching account info:', error);
      setAccountInfo(null);
    }
  };

  // Calculate Savings Progress
  const calculateProgress = (): number => {
    if (!accountInfo || accountInfo.goal.isZero()) return 0;
    const progress = accountInfo.balance.mul(100).div(accountInfo.goal);
    return Math.min(100, parseInt(progress.toString()));
  };

  // Check status on account/network change
  useEffect(() => {
    checkPremiumStatus();
    fetchAccountInfo();
  }, [account, isCorrectNetwork, provider]);

  return (
    <Box bg={bgColor} p={6} borderRadius="lg" boxShadow="base">
      <Flex direction="column" gap={6}>
        <Heading size="md">Hajj Savings Program</Heading>
        
        {/* Premium Verification Section */}
        {!isPremiumUser && (
          <Box>
            <FormControl>
              <FormLabel>Transaction Hash for Premium Verification</FormLabel>
              <Flex gap={2}>
                <NumberInput flex={1}>
                  <NumberInputField
                    value={txHash}
                    onChange={(e) => setTxHash(e.target.value)}
                    placeholder="Enter transaction hash"
                  />
                </NumberInput>
                <Button 
                  onClick={() => setTxHash(brevisService.getSampleTransactionHash())}
                >
                  Sample
                </Button>
              </Flex>
            </FormControl>
            <Button 
              mt={2} 
              colorScheme="blue" 
              onClick={verifyPremiumStatus}
              isLoading={isVerifying}
              width="full"
            >
              Verify Premium Status
            </Button>
          </Box>
        )}

        {/* Account Creation Section */}
        {isPremiumUser && !accountInfo?.isActive && (
          <Box>
            <FormControl>
              <FormLabel>Hajj Savings Goal (ETH)</FormLabel>
              <NumberInput min={0} precision={4}>
                <NumberInputField
                  value={goalAmount}
                  onChange={(e) => setGoalAmount(e.target.value)}
                  placeholder="Enter your Hajj savings goal"
                />
              </NumberInput>
            </FormControl>
            <Flex mt={2} gap={2}>
              <Button 
                flex={1}
                colorScheme="green" 
                onClick={createAccount}
                isLoading={isCreating}
              >
                Create Account (Real)
              </Button>
              <Button 
                flex={1}
                colorScheme="purple" 
                onClick={mockCreateAccount}
                isLoading={isCreating}
              >
                Mock Create
              </Button>
            </Flex>
          </Box>
        )}

        {/* Active Account Section */}
        {accountInfo?.isActive && (
          <Box>
            <Flex justify="space-between" mb={2}>
              <Text>Goal:</Text>
              <Text fontWeight="bold">{formatEther(accountInfo.goal)} ETH</Text>
            </Flex>
            <Flex justify="space-between" mb={2}>
              <Text>Current Balance:</Text>
              <Text fontWeight="bold">{formatEther(accountInfo.balance)} ETH</Text>
            </Flex>
            
            <Progress 
              value={calculateProgress()} 
              colorScheme="green" 
              size="lg" 
              borderRadius="md"
              mb={2}
            />
            
            <FormControl mt={4}>
              <FormLabel>Deposit Amount (ETH)</FormLabel>
              <NumberInput min={0} precision={4}>
                <NumberInputField
                  value={depositAmount}
                  onChange={(e) => setDepositAmount(e.target.value)}
                  placeholder="Enter deposit amount"
                />
              </NumberInput>
            </FormControl>
            
            <Flex mt={2} gap={2}>
              <Button 
                flex={1}
                colorScheme="blue" 
                onClick={deposit}
                isLoading={isDepositing}
              >
                Deposit (Real)
              </Button>
              <Button 
                flex={1}
                colorScheme="purple" 
                onClick={mockDeposit}
                isLoading={isDepositing}
              >
                Mock Deposit
              </Button>
            </Flex>
          </Box>
        )}
      </Flex>
    </Box>
  );
};

export default HajjAccount;