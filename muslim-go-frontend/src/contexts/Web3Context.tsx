import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { ethers } from 'ethers';
import { SEPOLIA_NETWORK } from '../utils/contracts';

interface Web3ContextType {
  account: string | null;
  provider: ethers.providers.Web3Provider | null;
  isConnecting: boolean;
  error: string | null;
  connectWallet: () => Promise<void>;
  disconnectWallet: () => void;
  switchToSepolia: () => Promise<void>;
  isCorrectNetwork: boolean;
}

const Web3Context = createContext<Web3ContextType | undefined>(undefined);

export const Web3Provider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [account, setAccount] = useState<string | null>(null);
  const [provider, setProvider] = useState<ethers.providers.Web3Provider | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isCorrectNetwork, setIsCorrectNetwork] = useState(false);

  // Check if the wallet is on the correct network
// Check if the wallet is on the correct network
const checkNetwork = async (provider: ethers.providers.Web3Provider) => {
  try {
    const network = await provider.getNetwork();
    console.log("Current network:", network); // Add this for debugging
    
    // Sepolia testnet has chainId 11155111
    const isCorrect = network.chainId === 11155111;
    setIsCorrectNetwork(isCorrect);
    return isCorrect;
  } catch (error) {
    console.error("Error checking network:", error);
    setIsCorrectNetwork(false);
    return false;
  }
};

  // Switch to Sepolia network
  const switchToSepolia = async () => {
    if (!window.ethereum) {
      setError("MetaMask is not installed!");
      return;
    }

    try {
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: SEPOLIA_NETWORK.chainId }],
      });
    } catch (switchError: any) {
      // This error code indicates that the chain has not been added to MetaMask
      if (switchError.code === 4902) {
        try {
          await window.ethereum.request({
            method: 'wallet_addEthereumChain',
            params: [SEPOLIA_NETWORK],
          });
        } catch (addError) {
          setError("Failed to add Sepolia network to MetaMask");
        }
      } else {
        setError("Failed to switch to Sepolia network");
      }
    }

    if (provider) {
      checkNetwork(provider);
    }
  };

  // Connect wallet
  const connectWallet = async () => {
    if (!window.ethereum) {
      setError("MetaMask is not installed!");
      return;
    }

    setIsConnecting(true);
    setError(null);

    try {
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
      
      if (accounts.length === 0) {
        setError("No accounts found");
        setIsConnecting(false);
        return;
      }

      setAccount(accounts[0]);
      setProvider(provider);

      // Check if on the correct network
      const isCorrect = await checkNetwork(provider);
      if (!isCorrect) {
        setError("Please switch to Sepolia network");
      }

    } catch (error: any) {
      console.error("Error connecting wallet:", error);
      setError(error.message || "Failed to connect wallet");
    } finally {
      setIsConnecting(false);
    }
  };

  // Disconnect wallet
  const disconnectWallet = () => {
    setAccount(null);
    setProvider(null);
    setError(null);
  };

  // Listen for account changes
  useEffect(() => {
    if (window.ethereum) {
      window.ethereum.on('accountsChanged', (accounts: string[]) => {
        if (accounts.length > 0) {
          setAccount(accounts[0]);
        } else {
          disconnectWallet();
        }
      });

      window.ethereum.on('chainChanged', () => {
        if (provider) {
          checkNetwork(provider);
        }
      });
    }

    return () => {
      if (window.ethereum) {
        window.ethereum.removeAllListeners('accountsChanged');
        window.ethereum.removeAllListeners('chainChanged');
      }
    };
  }, [provider]);

  // Auto connect if previously connected
  useEffect(() => {
    const autoConnect = async () => {
      if (window.ethereum) {
        try {
          const provider = new ethers.providers.Web3Provider(window.ethereum);
          const accounts = await provider.listAccounts();
          
          if (accounts.length > 0) {
            setAccount(accounts[0]);
            setProvider(provider);
            checkNetwork(provider);
          }
        } catch (error) {
          console.error("Auto connect error:", error);
        }
      }
    };

    autoConnect();
  }, []);

  return (
    <Web3Context.Provider
      value={{
        account,
        provider,
        isConnecting,
        error,
        connectWallet,
        disconnectWallet,
        switchToSepolia,
        isCorrectNetwork
      }}
    >
      {children}
    </Web3Context.Provider>
  );
};

// Custom hook to use the Web3 context
export const useWeb3 = () => {
  const context = useContext(Web3Context);
  if (context === undefined) {
    throw new Error('useWeb3 must be used within a Web3Provider');
  }
  return context;
};

// Add this to the Window interface
declare global {
  interface Window {
    ethereum?: any;
  }
}