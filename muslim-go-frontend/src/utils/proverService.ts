import axios from 'axios';
import { ethers } from 'ethers';

// Prover service URLs
const ZAKAT_PROVER_URL = 'http://localhost:33257'; // REST API port for Zakat prover
const PREMIUM_PROVER_URL = 'http://localhost:33258'; // REST API port for Premium prover

// Interface for proof generation response
interface ProofResponse {
  proof: string;
  blockNum: number;
  userAddress: string;
  assetValue: string;
}

// Generate a Zakat proof for the given asset value
export const generateZakatProof = async (
  address: string,
  assetValue: ethers.BigNumber
): Promise<ProofResponse> => {
  console.log('Generating Zakat proof for address:', address, 'with asset value:', assetValue.toString());
  
  try {
    // Call the Zakat prover service
    const response = await axios.post(`${ZAKAT_PROVER_URL}/api/generateProof`, {
      address: address,
      assetValue: assetValue.toString()
    });
    
    if (response.status !== 200 || !response.data.proof) {
      throw new Error('Failed to generate proof: ' + JSON.stringify(response.data));
    }
    
    return response.data;
  } catch (error) {
    console.error('Error generating Zakat proof:', error);
    throw error;
  }
};

// Generate a Premium verification proof
export const generatePremiumProof = async (
  address: string
): Promise<any> => {
  console.log('Generating Premium proof for address:', address);
  
  try {
    // Call the Premium prover service
    const response = await axios.post(`${PREMIUM_PROVER_URL}/api/generateProof`, {
      address: address
    });
    
    if (response.status !== 200 || !response.data.proof) {
      throw new Error('Failed to generate proof: ' + JSON.stringify(response.data));
    }
    
    return response.data;
  } catch (error) {
    console.error('Error generating Premium proof:', error);
    throw error;
  }
};

// Mock function for local development/testing
export const mockGenerateZakatProof = async (
  address: string,
  assetValue: ethers.BigNumber
): Promise<any> => {
  console.log('Mocking Zakat proof for address:', address, 'with asset value:', assetValue.toString());
  
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  // For testing, you can implement a direct smart contract call that bypasses proof verification
  // This is only for development and should not be used in production
  return {
    success: true,
    message: 'Mock proof generated successfully'
  };
};