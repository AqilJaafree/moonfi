// test-local-proof.js
const { Brevis, ProofRequest, Prover, ReceiptData, Field } = require('brevis-sdk-typescript');
const { ethers } = require('ethers');
require('dotenv').config();

async function main() {
  // Test transaction from Brevis example
  const txHash = '0x8a7fc50330533cd0adbf71e1cfb51b1b6bbe2170b4ce65c02678cf08c8b17737';
  
  console.log(`Processing Zakat verification for transaction: ${txHash}`);

  try {
    // Connect to local prover
    const prover = new Prover('localhost:33247');
    const brevis = new Brevis('appsdkv3.brevis.network:443');

    // Create proof request
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
            field_index: 0, // Asset value from data
          }),
        ],
      }),
    );

    // Generate proof
    console.log('Generating proof using local prover...');
    const proofRes = await prover.prove(proofReq);
    if (proofRes.has_err) {
      console.error(`Error generating proof: ${proofRes.err.code} - ${proofRes.err.msg}`);
      return;
    }
    
    console.log(`Proof generated successfully!`);
    console.log(`VK Hash: ${proofRes.proof.vkHash}`);

    // Submit to Brevis network
    const zakatAddress = '0xe41279A05f3eEc58acDB7Df13De3148db912DFD5';
    console.log(`Submitting proof to Brevis network (target contract: ${zakatAddress})...`);
    const brevisRes = await brevis.submit(proofReq, proofRes, 1, 11155111, 0, "", zakatAddress);
    
    console.log('Proof submitted successfully!');
    console.log('Response:', brevisRes);
    
    // Wait for on-chain verification
    console.log('Waiting for on-chain verification...');
    await brevis.wait(brevisRes.queryKey, 11155111);
    
    console.log(`Zakat verification completed successfully on-chain!`);
  } catch (err) {
    console.error('Error:', err);
  }
}

main().catch(console.error);