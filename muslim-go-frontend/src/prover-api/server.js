const express = require("express");
const cors = require("cors");
const {
  Brevis,
  ProofRequest,
  Prover,
  ReceiptData,
  Field,
} = require("brevis-sdk-typescript");

const app = express();
app.use(cors());
app.use(express.json());

// Initialize provers
const zakatProver = new Prover("localhost:33247");
const premiumProver = new Prover("localhost:33248");
const brevis = new Brevis("appsdkv3.brevis.network:443");

// Health check endpoint
app.get("/status", (req, res) => {
  res.json({ status: "ok", message: "Prover API service is running" });
});

// Debug endpoint to get info about a transaction
app.get("/api/debug/tx/:txHash", async (req, res) => {
  try {
    const { txHash } = req.params;

    if (!txHash) {
      return res.status(400).json({ error: "Transaction hash is required" });
    }

    // Initialize a provider - for demonstration, we're using Sepolia
    const ethers = require("ethers");
    const provider = new ethers.providers.JsonRpcProvider(
      "https://rpc.sepolia.org"
    );

    // Get transaction receipt
    const receipt = await provider.getTransactionReceipt(txHash);

    if (!receipt) {
      return res.status(404).json({ error: "Transaction not found" });
    }

    // Extract logs for debugging
    const logs = receipt.logs.map((log, index) => {
      return {
        logIndex: index,
        address: log.address,
        topics: log.topics.map((topic) => topic.toString()),
        data: log.data,
      };
    });

    return res.json({
      receipt: {
        blockNumber: receipt.blockNumber,
        from: receipt.from,
        to: receipt.to,
        status: receipt.status,
        logs: logs,
      },
    });
  } catch (error) {
    console.error("Error getting transaction details:", error);
    return res
      .status(500)
      .json({ error: error.message || "An error occurred" });
  }
});

// Endpoint to generate a Zakat proof
app.post("/api/zakat/generate-proof", async (req, res) => {
  try {
    const { txHash } = req.body;

    if (!txHash) {
      return res.status(400).json({ error: "Transaction hash is required" });
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

    // Generate proof
    console.log("Generating proof...");
    const proofRes = await zakatProver.prove(proofReq);

    if (proofRes.has_err) {
      const err = proofRes.err;
      console.error(`Error ${err.code}: ${err.msg}`);
      return res
        .status(400)
        .json({ error: `Proof generation failed: ${err.msg}` });
    }

    console.log("Proof generated successfully");
    console.log("Proof response:", JSON.stringify(proofRes, null, 2));

    // For debugging purposes, return the proof data without submitting to Brevis
    return res.json({
      success: true,
      message:
        "Proof generated successfully - proceed with asset verification using generated proof",
      proofData: {
        // Extract relevant data from proofRes for debugging
        hasErr: proofRes.has_err,
        // Include other available fields from proofRes
        vkHash: proofRes.vkHash || proofRes.vk_hash,
        // Log the proof format for debugging
        proofFormat: Object.keys(proofRes).join(", "),
        // Include output data if available
        outputData: proofRes.outputData || proofRes.output,
      },
    });

    /* Commenting out the Brevis submit part for now to focus on getting the proof working
    
    // Submit to Brevis network
    try {
      // For Sepolia testnet (chain ID 11155111)
      const brevisRes = await brevis.submit(
        proofReq,         // request
        proofRes,         // proof
        1,                // srcChainId
        11155111,         // dstChainId
        0,                // option
        "",               // apiKey
        ""                // callbackAddress
      );
      
      console.log('Proof submitted to Brevis network:', brevisRes);
      
      // Wait for verification to complete
      await brevis.wait(brevisRes.queryKey, 11155111);
      console.log('Zakat verification completed successfully!');
      
      // Return the proof response
      return res.json({
        success: true,
        queryKey: brevisRes.queryKey,
        vkHash: proofRes.vkHash || proofRes.vk_hash,
        proof: proofRes.proof,
        message: 'Proof generated and verified successfully'
      });
    } catch (err) {
      console.error('Error submitting proof to Brevis network:', err);
      return res.status(500).json({ error: `Error submitting proof: ${err.message}` });
    }
    */
  } catch (error) {
    console.error("Error processing request:", error);
    return res
      .status(500)
      .json({ error: error.message || "An error occurred" });
  }
});

// Start the server
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Prover API server running on port ${PORT}`);
});
