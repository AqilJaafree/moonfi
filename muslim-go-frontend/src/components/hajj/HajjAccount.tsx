import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  FormControl,
  FormLabel,
  Flex,
  Text,
  Heading,
  Divider,
  useColorModeValue,
  Progress,
  NumberInput,
  NumberInputField,
  useToast,
  Alert,
  AlertIcon,
  AlertDescription,
} from '@chakra-ui/react';
import { ethers } from 'ethers';
import { useWeb3 } from '../../contexts/Web3Context';
import { getHajjContract, parseEther, formatEther } from '../../utils/contracts';

interface AccountInfo {
  goal: ethers.BigNumber;
  balance: ethers.BigNumber;
  lastUpdateTime: ethers.BigNumber;
  isActive: boolean;
}

const HajjAccount: React.FC = () => {
  const { account, provider, isCorrectNetwork } = useWeb3();
  const [isPremiumUser, setIsPremiumUser] = useState(false);
  const [accountInfo, setAccountInfo] = useState<AccountInfo | null>(null);
  const [goalAmount, setGoalAmount] = useState('');
  const [depositAmount, setDepositAmount] = useState('');
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [isDepositing, setIsDepositing] = useState(false);
  const [isWithdrawing, setIsWithdrawing] = useState(false);
  const toast = useToast();
  
  const bgColor = useColorModeValue('white', 'gray.700');
  const progressColor = useColorModeValue('green.500', 'green.300');

  // Check if user is a verified premium user
  const checkPremiumStatus = async () => {
    if (!provider || !account || !isCorrectNetwork) {
      setIsPremiumUser(false);
      return;
    }
    
    try {
      const hajjContract = getHajjContract(provider);
      const status = await hajjContract.verifiedPremiumUsers(account);
      setIsPremiumUser(status);
    } catch (error) {
      console.error('Error checking premium status:', error);
      setIsPremiumUser(false);
    }
  };

  // Fetch account information
  const fetchAccountInfo = async () => {
    if (!provider || !account || !isCorrectNetwork) {
      setAccountInfo(null);
      return;
    }
    
    try {
      const hajjContract = getHajjContract(provider);
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

  // Create a Hajj savings account
  const createAccount = async () => {
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

    if (!isPremiumUser) {
      toast({
        title: 'Premium required',
        description: 'You need to be a verified premium user',
        status: 'warning',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    if (!goalAmount || parseFloat(goalAmount) <= 0) {
      toast({
        title: 'Invalid amount',
        description: 'Please enter a valid goal amount',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    setIsCreating(true);
    try {
      const hajjContract = getHajjContract(provider);
      const tx = await hajjContract.createAccount(parseEther(goalAmount));
      
      toast({
        title: 'Transaction sent',
        description: 'Your account creation is being processed',
        status: 'info',
        duration: 5000,
        isClosable: true,
      });
      
      await tx.wait();
      
      toast({
        title: 'Account created',
        description: 'Your Hajj savings account has been created successfully',
        status: 'success',
        duration: 5000,
        isClosable: true,
      });
      
      // Reset form and refresh data
      setGoalAmount('');
      fetchAccountInfo();
    } catch (error: any) {
      console.error('Account creation error:', error);
      toast({
        title: 'Account creation failed',
        description: error.message || 'An error occurred',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsCreating(false);
    }
  };

  // Deposit to Hajj savings account
  const deposit = async () => {
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

    if (!accountInfo?.isActive) {
      toast({
        title: 'No active account',
        description: 'You need to create an account first',
        status: 'warning',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    if (!depositAmount || parseFloat(depositAmount) <= 0) {
      toast({
        title: 'Invalid amount',
        description: 'Please enter a valid deposit amount',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    setIsDepositing(true);
    try {
      const hajjContract = getHajjContract(provider);
      const tx = await hajjContract.deposit({
        value: parseEther(depositAmount)
      });
      
      toast({
        title: 'Transaction sent',
        description: 'Your deposit is being processed',
        status: 'info',
        duration: 5000,
        isClosable: true,
      });
      
      await tx.wait();
      
      toast({
        title: 'Deposit successful',
        description: 'Your funds have been added to your Hajj savings account',
        status: 'success',
        duration: 5000,
        isClosable: true,
      });
      
      // Reset form and refresh data
      setDepositAmount('');
      fetchAccountInfo();
    } catch (error: any) {
      console.error('Deposit error:', error);
      toast({
        title: 'Deposit failed',
        description: error.message || 'An error occurred',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsDepositing(false);
    }
  };

  // Withdraw from Hajj savings account
  const withdraw = async () => {
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

    if (!accountInfo?.isActive) {
      toast({
        title: 'No active account',
        description: 'You need to create an account first',
        status: 'warning',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    if (!withdrawAmount || parseFloat(withdrawAmount) <= 0) {
      toast({
        title: 'Invalid amount',
        description: 'Please enter a valid withdrawal amount',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    const withdrawWei = parseEther(withdrawAmount);
    if (withdrawWei.gt(accountInfo.balance)) {
      toast({
        title: 'Insufficient funds',
        description: 'Withdrawal amount exceeds your balance',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    setIsWithdrawing(true);
    try {
      const hajjContract = getHajjContract(provider);
      const tx = await hajjContract.withdraw(withdrawWei);
      
      toast({
        title: 'Transaction sent',
        description: 'Your withdrawal is being processed',
        status: 'info',
        duration: 5000,
        isClosable: true,
      });
      
      await tx.wait();
      
      toast({
        title: 'Withdrawal successful',
        description: 'Your funds have been withdrawn from your Hajj savings account',
        status: 'success',
        duration: 5000,
        isClosable: true,
      });
      
      // Reset form and refresh data
      setWithdrawAmount('');
      fetchAccountInfo();
    } catch (error: any) {
      console.error('Withdrawal error:', error);
      toast({
        title: 'Withdrawal failed',
        description: error.message || 'An error occurred',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsWithdrawing(false);
    }
  };

  // Calculate progress percentage
  const calculateProgress = (): number => {
    if (!accountInfo || accountInfo.goal.isZero()) return 0;
    
    const progress = accountInfo.balance.mul(100).div(accountInfo.goal);
    return Math.min(100, parseInt(progress.toString()));
  };

  // Format date from timestamp
  const formatDate = (timestamp: ethers.BigNumber): string => {
    if (timestamp.isZero()) return 'Never';
    const date = new Date(timestamp.toNumber() * 1000);
    return date.toLocaleDateString();
  };

  // Fetch account data when required
  useEffect(() => {
    checkPremiumStatus();
    fetchAccountInfo();
  }, [account, isCorrectNetwork, provider]);

  return (
    <Box bg={bgColor} p={6} borderRadius="lg" boxShadow="base">
      <Flex direction="column" gap={6}>
        <Heading size="md">Hajj Savings Program</Heading>
        <Text>
          Save for your Hajj pilgrimage with our Shariah-compliant savings account. 
          Set a goal, make regular contributions, and track your progress.
        </Text>
        
        {!account && (
          <Alert status="warning">
            <AlertIcon />
            <AlertDescription>Please connect your wallet to use Hajj savings</AlertDescription>
          </Alert>
        )}

        {account && !isCorrectNetwork && (
          <Alert status="warning">
            <AlertIcon />
            <AlertDescription>Please switch to Sepolia network</AlertDescription>
          </Alert>
        )}

        {account && isCorrectNetwork && !isPremiumUser && (
          <Alert status="info">
            <AlertIcon />
            <AlertDescription>
              This is a premium feature. You need to be a verified premium user to access Hajj savings.
            </AlertDescription>
          </Alert>
        )}

        {account && isCorrectNetwork && isPremiumUser && (
          <>
            {!accountInfo?.isActive ? (
              <Box borderWidth={1} borderRadius="md" p={5}>
                <Heading size="sm" mb={3}>Create Hajj Savings Account</Heading>
                <FormControl id="goalAmount" mb={4}>
                  <FormLabel>Savings Goal (ETH)</FormLabel>
                  <NumberInput min={0} precision={4}>
                    <NumberInputField
                      value={goalAmount}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => setGoalAmount(e.target.value)}
                      placeholder="Enter your Hajj savings goal"
                    />
                  </NumberInput>
                  <Text fontSize="sm" color="gray.500" mt={1}>
                    Set a realistic goal for your Hajj pilgrimage expenses
                  </Text>
                </FormControl>
                <Button
                  colorScheme="green"
                  onClick={createAccount}
                  isLoading={isCreating}
                  loadingText="Creating..."
                  isDisabled={!goalAmount || parseFloat(goalAmount) <= 0}
                >
                  Create Savings Account
                </Button>
              </Box>
            ) : (
              <>
                <Box borderWidth={1} borderRadius="md" p={5}>
                  <Heading size="sm" mb={3}>Your Hajj Savings</Heading>
                  <Flex justify="space-between" mb={2}>
                    <Text>Goal:</Text>
                    <Text fontWeight="bold">{formatEther(accountInfo.goal)} ETH</Text>
                  </Flex>
                  <Flex justify="space-between" mb={2}>
                    <Text>Current Balance:</Text>
                    <Text fontWeight="bold">{formatEther(accountInfo.balance)} ETH</Text>
                  </Flex>
                  <Flex justify="space-between" mb={4}>
                    <Text>Last Update:</Text>
                    <Text>{formatDate(accountInfo.lastUpdateTime)}</Text>
                  </Flex>
                  
                  <Text mb={2}>Progress toward goal:</Text>
                  <Progress 
                    value={calculateProgress()} 
                    colorScheme="green" 
                    size="lg" 
                    borderRadius="md"
                    mb={2}
                  />
                  <Text fontSize="sm" textAlign="right" mb={4}>
                    {calculateProgress()}% complete
                  </Text>
                  
                  <Divider my={4} />
                  
                  <Flex gap={4} align="flex-start">
                    <Box flex={1}>
                      <Heading size="xs" mb={2}>Make a Deposit</Heading>
                      <FormControl id="depositAmount" mb={2}>
                        <NumberInput min={0} precision={4} size="sm">
                          <NumberInputField
                            value={depositAmount}
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setDepositAmount(e.target.value)}
                            placeholder="Amount in ETH"
                          />
                        </NumberInput>
                      </FormControl>
                      <Button
                        size="sm"
                        colorScheme="blue"
                        onClick={deposit}
                        isLoading={isDepositing}
                        loadingText="Depositing..."
                        isDisabled={!depositAmount || parseFloat(depositAmount) <= 0}
                        width="full"
                      >
                        Deposit
                      </Button>
                    </Box>
                    
                    <Box flex={1}>
                      <Heading size="xs" mb={2}>Withdraw Funds</Heading>
                      <FormControl id="withdrawAmount" mb={2}>
                        <NumberInput min={0} max={parseFloat(formatEther(accountInfo.balance))} precision={4} size="sm">
                          <NumberInputField
                            value={withdrawAmount}
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setWithdrawAmount(e.target.value)}
                            placeholder="Amount in ETH"
                          />
                        </NumberInput>
                      </FormControl>
                      <Button
                        size="sm"
                        colorScheme="orange"
                        onClick={withdraw}
                        isLoading={isWithdrawing}
                        loadingText="Withdrawing..."
                        isDisabled={!withdrawAmount || parseFloat(withdrawAmount) <= 0 || parseFloat(withdrawAmount) > parseFloat(formatEther(accountInfo.balance))}
                        width="full"
                      >
                        Withdraw
                      </Button>
                    </Box>
                  </Flex>
                </Box>
                
                {calculateProgress() >= 100 && (
                  <Alert status="success" mt={4}>
                    <AlertIcon />
                    <AlertDescription>
                      Congratulations! You've reached your Hajj savings goal.
                    </AlertDescription>
                  </Alert>
                )}
              </>
            )}
          </>
        )}
      </Flex>
    </Box>
  );
};

export default HajjAccount;