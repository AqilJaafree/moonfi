import { Brevis, ProofRequest, Prover, ReceiptData, Field } from 'brevis-sdk-typescript';
import { ethers } from 'ethers';

// Create a class to handle Brevis interactions
export class BrevisService {
  private zakatProver: Prover;
  private premiumProver: Prover;
  private brevis: Brevis;

  constructor() {
    // Connect to provers
    this.zakatProver = new Prover('localhost:33247');
    this.premiumProver = new Prover('localhost:33248');
    this.brevis = new Brevis('appsdkv3.brevis.network:443');
  }

  /**
   * Generate a proof for asset verification
   * 
   * @param txHash The transaction hash containing the asset information
   * @param isZakat Whether this is for Zakat (true) or Premium (false)
   * @returns The proof response
   */
  async generateProof(txHash: string, isZakat: boolean = true) {
    const prover = isZakat ? this.zakatProver : this.premiumProver;
    const modeName = isZakat ? 'Zakat' : 'Premium';
    
    console.log(`Generating ${modeName} proof for transaction ${txHash}`);
    
    // Create proof request (same structure for both Zakat and Premium as per your test files)
    const proofReq = new ProofRequest();
    proofReq.addReceipt(
      new ReceiptData({
        tx_hash: txHash,
        fields: [
          new Field({
            log_pos: 0, 
            is_topic: true,
            field_index: 1, // User address from topic
          }),
          new Field({
            log_pos: 0,
            is_topic: false,
            field_index: 0, // Asset value or premium status
          }),
        ],
      }),
    );

    // Generate proof
    try {
      console.log(`Sending proof request to the ${modeName} prover...`);
      const proofRes = await prover.prove(proofReq);
      
      if (proofRes.has_err) {
        const err = proofRes.err;
        console.error(`Error ${err.code}: ${err.msg}`);
        throw new Error(`Proof generation failed: ${err.msg}`);
      }
      
      console.log(`${modeName} proof generated successfully`);
      
      // Submit proof to Brevis network
      try {
        // For Sepolia testnet (chain ID 11155111)
        const brevisRes = await this.brevis.submit(
          proofReq,           // request
          proofRes,           // proof
          1,                  // srcChainId (mainnet since the tx is from there)
          11155111,           // dstChainId (Sepolia)
          0,                  // option
          "",                 // apiKey (empty string as per your example)
          ""                  // callbackAddress (empty string as per your example)
        );
        
        console.log('Proof submitted to Brevis network:', brevisRes);
        
        // Wait for verification to complete
        await this.brevis.wait(brevisRes.queryKey, 11155111);
        console.log(`${modeName} verification completed successfully!`);
        
        return {
          success: true,
          queryKey: brevisRes.queryKey,
          vkHash: (proofRes as any).vkHash || (proofRes as any).vk_hash,
          proof: (proofRes as any).proof
        };
      } catch (err: any) {
        console.error('Error submitting proof to Brevis network:', err);
        throw new Error(`Error submitting proof: ${err.message || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error during proof generation:', error);
      throw error;
    }
  }

  /**
   * Helper function to get a sample transaction hash
   * This is just for testing purposes
   * 
   * @returns A sample transaction hash
   */
  getSampleTransactionHash(): string {
    // This is the sample hash used in your test files
    return '0x8a7fc50330533cd0adbf71e1cfb51b1b6bbe2170b4ce65c02678cf08c8b17737';
  }
}

// Create and export a singleton instance
export const brevisService = new BrevisService();