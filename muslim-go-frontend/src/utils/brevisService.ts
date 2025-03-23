import axios from 'axios';

// Make sure these match the ports where your API server is running
const API_SERVER_URL = 'http://localhost:3001';

export class BrevisService {
  /**
   * Generate a proof for Zakat verification and submit it to Brevis network
   * 
   * @param txHash The transaction hash containing the asset information
   * @param userAddress The user's address to be used for callbacks
   * @returns The proof response with verification status
   */
  async generateZakatProof(txHash: string, userAddress?: string) {
    console.log(`Generating Zakat proof for transaction ${txHash}`);
    
    try {
      // First, check if the server is available
      const statusResponse = await axios.get(`${API_SERVER_URL}/status`);
      if (statusResponse.status !== 200) {
        throw new Error(`API server is not available`);
      }
      
      // Send the request to generate and submit proof
      const response = await axios.post(`${API_SERVER_URL}/api/generate-proof/zakat`, {
        txHash: txHash,
        userAddress: userAddress
      });
      
      if (response.status !== 200 || !response.data.success) {
        throw new Error(`Proof verification failed: ${JSON.stringify(response.data)}`);
      }
      
      console.log(`Zakat proof generated successfully:`, response.data);
      
      return {
        success: true,
        proofData: response.data.proofData,
        queryKey: response.data.proofData?.queryKey,
        vkHash: response.data.proofData?.vkHash,
        verified: response.data.proofData?.verified,
        message: `Zakat verification successful`
      };
    } catch (error: any) {
      console.error(`Error generating Zakat proof:`, error);
      return {
        success: false,
        error: error.message || `Failed to generate Zakat proof`
      };
    }
  }

  /**
   * Generate a proof for Premium verification and submit it to Brevis network
   * 
   * @param txHash The transaction hash containing the premium status
   * @param userAddress The user's address to be used for callbacks
   * @returns The proof response with verification status
   */
  async generatePremiumProof(txHash: string, userAddress?: string) {
    console.log(`Generating Premium proof for transaction ${txHash}`);
    
    try {
      // First, check if the server is available
      const statusResponse = await axios.get(`${API_SERVER_URL}/status`);
      if (statusResponse.status !== 200) {
        throw new Error(`API server is not available`);
      }
      
      // Send the request to generate and submit proof
      const response = await axios.post(`${API_SERVER_URL}/api/generate-proof/premium`, {
        txHash: txHash,
        userAddress: userAddress
      });
      
      if (response.status !== 200 || !response.data.success) {
        throw new Error(`Proof verification failed: ${JSON.stringify(response.data)}`);
      }
      
      console.log(`Premium proof generated successfully:`, response.data);
      
      return {
        success: true,
        proofData: response.data.proofData,
        queryKey: response.data.proofData?.queryKey,
        vkHash: response.data.proofData?.vkHash,
        verified: response.data.proofData?.verified,
        message: `Premium verification successful`
      };
    } catch (error: any) {
      console.error(`Error generating Premium proof:`, error);
      return {
        success: false,
        error: error.message || `Failed to generate Premium proof`
      };
    }
  }

  /**
   * Check if a proof has been verified on the Brevis network
   * 
   * @param queryKey The query key returned from the proof generation
   * @returns Status of the proof verification
   */
  async checkProofStatus(queryKey: string) {
    if (!queryKey) {
      return {
        success: false,
        error: 'Query key is required'
      };
    }
    
    try {
      const response = await axios.get(`${API_SERVER_URL}/api/check-proof/${queryKey}`);
      
      if (response.status !== 200 || !response.data.success) {
        throw new Error(`Failed to check proof status: ${JSON.stringify(response.data)}`);
      }
      
      return {
        success: true,
        status: response.data.status,
        verified: response.data.verified
      };
    } catch (error: any) {
      console.error('Error checking proof status:', error);
      return {
        success: false,
        error: error.message || 'Failed to check proof status'
      };
    }
  }

  /**
   * Verify if the API server and prover services are available
   */
  async checkProverServices() {
    try {
      // First check if the API server is running
      try {
        await axios.get(`${API_SERVER_URL}/status`);
      } catch (error) {
        console.error('API server not available:', error);
        return {
          zakatService: false,
          premiumService: false,
          error: 'API server is not running. Please start the server on port 3001.'
        };
      }
      
      // Now check individual prover services through the API
      const [zakatStatus, premiumStatus] = await Promise.allSettled([
        axios.get(`${API_SERVER_URL}/zakat/status`),
        axios.get(`${API_SERVER_URL}/premium/status`)
      ]);
      
      return {
        zakatService: zakatStatus.status === 'fulfilled' && zakatStatus.value.status === 200,
        premiumService: premiumStatus.status === 'fulfilled' && premiumStatus.value.status === 200
      };
    } catch (error) {
      console.error('Error checking prover services:', error);
      return {
        zakatService: false,
        premiumService: false,
        error: (error as any).message || 'Failed to connect to prover services'
      };
    }
  }

  /**
   * Helper function to get a sample transaction hash
   * This is for testing purposes
   */
  getSampleTransactionHash(): string {
    // This is the sample hash used in the Brevis examples
    return '0x8a7fc50330533cd0adbf71e1cfb51b1b6bbe2170b4ce65c02678cf08c8b17737';
  }
}

// Create and export a singleton instance
export const brevisService = new BrevisService();