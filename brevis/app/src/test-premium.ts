// Create test-premium.ts with similar code but pointing to port 33248
import { Brevis, ProofRequest, Prover, ReceiptData, Field } from 'brevis-sdk-typescript';

async function testPremium() {
    // Connect to the Premium prover
    const prover = new Prover('localhost:33248');
    console.log('Connected to Premium prover');
    
    // Use a suitable transaction that would verify premium status
    const txHash = '0x8a7fc50330533cd0adbf71e1cfb51b1b6bbe2170b4ce65c02678cf08c8b17737';
    
    // Create proof request (same structure as Zakat for now)
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
                    field_index: 0, // Premium status value
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
        
        // Access properties dynamically to avoid TypeScript errors
        const proofResObj = proofRes as any;
        
        // Check for proof data
        if ('proof' in proofResObj && proofResObj.proof) {
            console.log(`- Found proof data, length: ${proofResObj.proof.length}`);
        }
        
        console.log('Test completed successfully!');
    } catch (error) {
        console.error('Error during proof generation:', error);
    }
}

testPremium().catch(console.error);