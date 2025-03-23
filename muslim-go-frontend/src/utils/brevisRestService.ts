import axios from 'axios';
import { ethers } from 'ethers';

// REST API endpoints
const ZAKAT_PROVER_REST_URL = 'http://localhost:33257';
const PREMIUM_PROVER_REST_URL = 'http://localhost:33258';

export class BrevisRestService {
  /**
   * Generate a proof using the Brevis REST API
   * 
   * @param txHash Transaction hash for verification
   * @param isZakat Whether this is for Zakat (true) or Premium (false)
   */
  async generateProof(txHash: string, isZakat: boolean = true) {
    const endpoint = isZakat ? ZAKAT_PROVER_REST_URL : PREMIUM_PROVER_REST_URL;
    const serviceName = isZakat ? 'Zakat' : 'Premium';
    
    console.log(`Generating ${serviceName} proof for transaction ${txHash} via REST API`);
    
    try {
      // Structure the proof request to match what the API expects
      const proofRequest = {
        receipts: [
          {
            txHash: txHash,
            fields: [
              {
                logPos: 0,
                isTopic: true,
                fieldIndex: 1 // User address from topic
              },
              {
                logPos: 0,
                isTopic: false,
                fieldIndex: 0 // Asset value or premium status
              }
            ]
          }
        ]
      };
      
      // Call the REST API endpoint to generate proof
      const response = await axios.post(`${endpoint}/generate-proof`, proofRequest, {
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      if (response.status !== 200) {
        throw new Error(`API returned error: ${response.statusText}`);
      }
      
      const proofData = response.data;
      console.log(`${serviceName} proof generated successfully via REST API:`, proofData);
      
      // Next, submit the proof to the Brevis network
      // Note: This may need to be done via a separate endpoint or service
      
      return {
        success: true,
        proof: proofData.proof,
        vkHash: proofData.vkHash,
        // Include other relevant data from the response
      };
    } catch (error: any) {
      console.error(`Error generating ${serviceName} proof:`, error);
      throw new Error(`Failed to generate proof: ${error.message || 'Unknown error'}`);
    }
  }

  /**
   * Verify if the REST API endpoints are available
   */
  async checkServiceAvailability() {
    try {
      // Check Zakat service
      const zakatStatus = await axios.get(`${ZAKAT_PROVER_REST_URL}/status`);
      const premiumStatus = await axios.get(`${PREMIUM_PROVER_REST_URL}/status`);
      
      return {
        zakatService: zakatStatus.status === 200,
        premiumService: premiumStatus.status === 200
      };
    } catch (error) {
      console.log('REST API endpoints are not reachable:', error);
      return {
        zakatService: false,
        premiumService: false,
        error: (error as any).message || 'Cannot connect to REST API endpoints'
      };
    }
  }
}

export const brevisRestService = new BrevisRestService();