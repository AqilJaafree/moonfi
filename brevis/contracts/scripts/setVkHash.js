// scripts/setVkHash.js
async function main() {
  const [deployer] = await ethers.getSigners();
  
  // Hardhat's run command doesn't forward command line arguments directly
  // So we need to check which contract to use from the process.env
  const contractName = process.env.CONTRACT_NAME;
  const contractAddress = process.env.CONTRACT_ADDRESS;
  const vkHash = process.env.VK_HASH;
  
  if (!contractName || !contractAddress || !vkHash) {
    console.error("Missing required environment variables:");
    console.error("CONTRACT_NAME, CONTRACT_ADDRESS, and VK_HASH must be set");
    return;
  }
  
  console.log(`Setting VK hash for ${contractName} at ${contractAddress}...`);
  console.log(`VK Hash: ${vkHash}`);
  console.log(`Using account: ${deployer.address}`);
  
  // Get contract factory
  const Contract = await ethers.getContractFactory(contractName);
  
  // Attach to deployed contract
  const contract = await Contract.attach(contractAddress);
  
  // Set VK hash
  console.log("Sending transaction...");
  const tx = await contract.setVkHash(vkHash);
  console.log(`Transaction hash: ${tx.hash}`);
  
  // Wait for confirmation
  console.log("Waiting for transaction confirmation...");
  const receipt = await tx.wait();
  
  console.log(`Transaction confirmed in block ${receipt.blockNumber}`);
  console.log(`VK hash successfully set for ${contractName}!`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });