import { Brevis, ProofRequest, Prover, ReceiptData, Field } from 'brevis-sdk-typescript';

async function testZakat() {
    // Connect to the Zakat prover
    const prover = new Prover('localhost:33247');
    console.log('Connected to Zakat prover');

    // Use a sample USDC transfer transaction
    // This is an example USDC transfer on mainnet
    const txHash = '0x8a7fc50330533cd0adbf71e1cfb51b1b6bbe2170b4ce65c02678cf08c8b17737';
    
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

    console.log('Sending proof request to the prover...');
    try {
        // Generate proof
        const proofRes = await prover.prove(proofReq);
        
        if (proofRes.has_err) {
            console.error(`Error ${proofRes.err.code}: ${proofRes.err.msg}`);
            return;
        }
        
        console.log('Proof generation successful!');
        
        // Log the entire response to see all available properties
        console.log('ProveResponse structure:');
        console.log(proofRes);
        
        // Access properties dynamically to avoid TypeScript errors
        const proofResObj = proofRes as any;
        
        // Check for various possible property names
        const possibleProofProps = ['proof', 'proofData', 'data', 'output'];
        for (const prop of possibleProofProps) {
            if (prop in proofResObj && proofResObj[prop]) {
                console.log(`- Found proof data in property '${prop}'`);
                console.log(`- Length: ${proofResObj[prop].length}`);
                break;
            }
        }
        
        // Check for various possible VK hash properties
        const possibleVkHashProps = ['vkHash', 'vk_hash', 'verificationKeyHash'];
        for (const prop of possibleVkHashProps) {
            if (prop in proofResObj && proofResObj[prop]) {
                console.log(`- Found verification key hash in property '${prop}': ${proofResObj[prop]}`);
                break;
            }
        }
        
        console.log('Test completed successfully!');
    } catch (error) {
        console.error('Error during proof generation:', error);
    }
}

testZakat().catch(console.error);