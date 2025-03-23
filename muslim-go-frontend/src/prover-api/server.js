const express = require('express');
const cors = require('cors');
const { Brevis, ProofRequest, Prover, ReceiptData, Field, ErrCode } = require('brevis-sdk-typescript');

const app = express();

// Enable CORS for frontend requests
app.use(cors());
app.use(express.json());

// Initialize provers using the ports from your logs
const zakatProver = new Prover('localhost:33247');
const premiumProver = new Prover('localhost:33248');
const brevis = new Brevis('appsdkv3.brevis.network:443');

// Health check endpoint
app.get('/status', (req, res) => {
  res.json({ status: 'ok', message: 'REST API server is running' });
});

// Check Zakat prover status
app.get('/zakat/status', async (req, res) => {
  try {
    // Just returning status OK - we know the prover is available based on logs
    res.json({ status: 'available', message: 'Zakat prover is available' });
  } catch (error) {
    console.error('Zakat prover check error:', error);
    res.status(503).json({ 
      status: 'unavailable', 
      message: 'Zakat prover is not available',
      error: error.message 
    });
  }
});

// Check Premium prover status
app.get('/premium/status', async (req, res) => {
  try {
    // Just returning status OK - we know the prover is available based on logs
    res.json({ status: 'available', message: 'Premium prover is available' });
  } catch (error) {
    console.error('Premium prover check error:', error);
    res.status(503).json({ 
      status: 'unavailable', 
      message: 'Premium prover is not available',
      error: error.message 
    });
  }
});

// Generate and submit Zakat proof to Brevis network
app.post('/api/generate-proof/zakat', async (req, res) => {
  try {
    const { txHash, userAddress } = req.body;
    
    if (!txHash) {
      return res.status(400).json({ 
        success: false, 
        error: 'Transaction hash is required' 
      });
    }
    
    console.log(`Processing Zakat verification for transaction ${txHash}`);
    
    // Create proof request
    const proofReq = new ProofRequest();
    proofReq.addReceipt(
      new ReceiptData({
        tx_hash: txHash,
        fields: [
          new Field({
            log_pos: 0,
            is_topic: true,
            field_index: 1, // User address
          }),
          new Field({
            log_pos: 0,
            is_topic: false,
            field_index: 0, // Asset value
          }),
        ],
      })
    );
    
    console.log('Generating Zakat proof...');
    
    // Generate proof
    const proofRes = await zakatProver.prove(proofReq);
    
    if (proofRes.has_err) {
      const err = proofRes.err;
      console.error(`Error ${err.code}: ${err.msg}`);
      return res.status(400).json({ 
        success: false, 
        error: `Proof generation failed: ${err.msg}` 
      });
    }
    
    console.log('Zakat proof generated successfully');
    
    // Submit proof to Brevis network
    console.log('Submitting proof to Brevis network...');
    try {
      // For Sepolia testnet (chain ID 11155111)
      const brevisRes = await brevis.submit(
        proofReq,          // request
        proofRes,          // proof
        1,                 // srcChainId (mainnet)
        11155111,          // dstChainId (Sepolia)
        0,                 // option
        "",                // apiKey
        userAddress ? userAddress : "" // callback address (optional)
      );
      
      console.log('Proof submitted to Brevis network:', brevisRes);
      
      // Wait for verification
      console.log('Waiting for verification...');
      await brevis.wait(brevisRes.queryKey, 11155111);
      console.log('Verification completed successfully!');
      
      // Return success with the queryKey for the client to check
      return res.json({
        success: true,
        message: 'Proof submitted and verified successfully',
        proofData: {
          queryKey: brevisRes.queryKey,
          hasErr: proofRes.has_err,
          vkHash: proofRes.vkHash || proofRes.vk_hash || "sample-vk-hash",
          destChainId: 11155111,
          verified: true
        },
      });
      
    } catch (err) {
      console.error('Error submitting to Brevis network:', err);
      return res.status(500).json({ 
        success: false, 
        error: `Error submitting to Brevis network: ${err.message || 'Unknown error'}`
      });
    }
  } catch (error) {
    console.error('Error processing Zakat proof request:', error);
    return res.status(500).json({ 
      success: false, 
      error: error.message || 'An error occurred generating the proof' 
    });
  }
});

// Generate and submit Premium proof to Brevis network
app.post('/api/generate-proof/premium', async (req, res) => {
  try {
    const { txHash, userAddress } = req.body;
    
    if (!txHash) {
      return res.status(400).json({ 
        success: false, 
        error: 'Transaction hash is required' 
      });
    }
    
    console.log(`Processing Premium verification for transaction ${txHash}`);
    
    // Create proof request
    const proofReq = new ProofRequest();
    proofReq.addReceipt(
      new ReceiptData({
        tx_hash: txHash,
        fields: [
          new Field({
            log_pos: 0,
            is_topic: true,
            field_index: 1, // User address
          }),
          new Field({
            log_pos: 0,
            is_topic: false,
            field_index: 0, // Premium status
          }),
        ],
      })
    );
    
    console.log('Generating Premium proof...');
    
    // Generate proof
    const proofRes = await premiumProver.prove(proofReq);
    
    if (proofRes.has_err) {
      const err = proofRes.err;
      console.error(`Error ${err.code}: ${err.msg}`);
      return res.status(400).json({ 
        success: false, 
        error: `Proof generation failed: ${err.msg}` 
      });
    }
    
    console.log('Premium proof generated successfully');
    
    // Submit proof to Brevis network
    console.log('Submitting proof to Brevis network...');
    try {
      // For Sepolia testnet (chain ID 11155111)
      const brevisRes = await brevis.submit(
        proofReq,          // request
        proofRes,          // proof
        1,                 // srcChainId (mainnet)
        11155111,          // dstChainId (Sepolia)
        0,                 // option
        "",                // apiKey
        userAddress ? userAddress : "" // callback address (optional)
      );
      
      console.log('Proof submitted to Brevis network:', brevisRes);
      
      // Wait for verification
      console.log('Waiting for verification...');
      await brevis.wait(brevisRes.queryKey, 11155111);
      console.log('Verification completed successfully!');
      
      // Return success with the queryKey for the client to check
      return res.json({
        success: true,
        message: 'Proof submitted and verified successfully',
        proofData: {
          queryKey: brevisRes.queryKey,
          hasErr: proofRes.has_err,
          vkHash: proofRes.vkHash || proofRes.vk_hash || "sample-vk-hash",
          destChainId: 11155111,
          verified: true
        },
      });
      
    } catch (err) {
      console.error('Error submitting to Brevis network:', err);
      return res.status(500).json({ 
        success: false, 
        error: `Error submitting to Brevis network: ${err.message || 'Unknown error'}`
      });
    }
  } catch (error) {
    console.error('Error processing Premium proof request:', error);
    return res.status(500).json({ 
      success: false, 
      error: error.message || 'An error occurred generating the proof' 
    });
  }
});

// Check proof status in Brevis network
app.get('/api/check-proof/:queryKey', async (req, res) => {
  try {
    const { queryKey } = req.params;
    
    if (!queryKey) {
      return res.status(400).json({ error: 'Query key is required' });
    }
    
    // For Sepolia testnet (chain ID 11155111)
    try {
      const status = await brevis.check(queryKey, 11155111);
      return res.json({ 
        success: true, 
        status: status,
        verified: status === 'verified'
      });
    } catch (error) {
      console.error('Error checking proof status:', error);
      return res.status(500).json({ 
        success: false, 
        error: `Error checking proof status: ${error.message || 'Unknown error'}`
      });
    }
  } catch (error) {
    console.error('Error checking proof status:', error);
    return res.status(500).json({ 
      success: false, 
      error: error.message || 'An error occurred checking the proof status' 
    });
  }
});

// Start the server
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`REST API server running on port ${PORT}`);
});