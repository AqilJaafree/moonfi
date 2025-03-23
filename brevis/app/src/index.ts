import { Brevis, ErrCode, ProofRequest, Prover, ReceiptData, Field } from 'brevis-sdk-typescript';
import { ethers } from 'ethers';

async function main() {
    // Get mode from command line (zakat or hajj)
    const mode = process.argv[2]?.toLowerCase();
    if (!mode || (mode !== 'zakat' && mode !== 'hajj')) {
        console.error('Please specify a mode: "zakat" or "hajj"');
        return;
    }

    // Get transaction hash
    const hash = process.argv[3];
    if (!hash || hash.length === 0) {
        console.error('Please provide a transaction hash');
        return;
    }

    // Connect to appropriate prover based on mode
    const proverPort = mode === 'zakat' ? '33247' : '33248';
    const prover = new Prover(`localhost:${proverPort}`);
    const brevis = new Brevis('appsdkv3.brevis.network:443');

    console.log(`Processing ${mode} verification for transaction ${hash}`);

    // Create proof request
    const proofReq = new ProofRequest();
    proofReq.addReceipt(
        new ReceiptData({
            tx_hash: hash,
            fields: [
                new Field({
                    log_pos: 0, 
                    is_topic: true,
                    field_index: 1, // User address
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
    console.log('Generating proof...');
    const proofRes = await prover.prove(proofReq);
    if (proofRes.has_err) {
        const err = proofRes.err;
        console.error(`Error ${err.code}: ${err.msg}`);
        return;
    }
    console.log('Proof generated successfully');

    try {
        // For Sepolia testnet (chain ID 11155111)
        const brevisRes = await brevis.submit(proofReq, proofRes, 1, 11155111, 0);
        console.log('Proof submitted to Brevis network:', brevisRes);

        await brevis.wait(brevisRes.queryKey, 11155111);
        console.log(`${mode.charAt(0).toUpperCase() + mode.slice(1)} verification completed successfully!`);
    } catch (err) {
        console.error('Error submitting proof:', err);
    }
}

main().catch(console.error);