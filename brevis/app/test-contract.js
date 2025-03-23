// test-contract.js
const { ethers } = require('ethers');
require('dotenv').config();

async function main() {
  // Check if environment variables are set
  if (!process.env.PRIVATE_KEY) {
    console.error("Error: PRIVATE_KEY is not set in the .env file");
    return;
  }
  
  if (!process.env.SEPOLIA_RPC_URL) {
    console.error("Error: SEPOLIA_RPC_URL is not set in the .env file");
    return;
  }
  
  // Make sure private key is properly formatted with 0x prefix if needed
  const privateKey = process.env.PRIVATE_KEY.startsWith('0x') 
    ? process.env.PRIVATE_KEY 
    : `0x${process.env.PRIVATE_KEY}`;
  
  console.log("Connecting to Sepolia...");
  
  // Connect to Sepolia
  const provider = new ethers.providers.JsonRpcProvider(process.env.SEPOLIA_RPC_URL);
  const wallet = new ethers.Wallet(privateKey, provider);
  
  // Contract ABIs - simplified for testing
  const zakatAbi = [
    "function contributeZakat() external payable",
    "function lastVerifiedAssets(address) view returns (uint256)",
    "function zakatContributions(address) view returns (uint256)",
    "event ZakatVerified(uint64 blockNum, address account, uint256 assetValue, uint256 zakatAmount)"
  ];
  
  const hajjAbi = [
    "function createAccount(uint256 goalAmount) external",
    "function deposit() external payable",
    "function accounts(address) view returns (uint256, uint256, uint256, bool)",
    "event AccountCreated(address indexed user, uint256 goal)"
  ];
  
  // Contract addresses
  const zakatAddress = "0xe41279A05f3eEc58acDB7Df13De3148db912DFD5";
  const hajjAddress = "0x0e2aeBE3E835d93DFB8BF3cF69A41c88f10368E7";
  
  // Create contract instances
  const zakatContract = new ethers.Contract(zakatAddress, zakatAbi, wallet);
  const hajjContract = new ethers.Contract(hajjAddress, hajjAbi, wallet);
  
  // Test contract interactions
  console.log("Testing MuslimGoZakat contract...");
  console.log(`Connected with address: ${wallet.address}`);
  
  try {
    // Even without a proof, we can test basic contract functionality
    console.log("Contributing 0.01 ETH to Zakat...");
    const zakatTx = await zakatContract.contributeZakat({
      value: ethers.utils.parseEther("0.01")
    });
    console.log(`Transaction hash: ${zakatTx.hash}`);
    await zakatTx.wait();
    console.log("Zakat contribution successful!");
    
    // Check Zakat state
    const contributions = await zakatContract.zakatContributions(wallet.address);
    console.log(`Your total Zakat contributions: ${ethers.utils.formatEther(contributions)} ETH`);
    
    // Test Hajj contract
    console.log("\nTesting MuslimGoHajj contract...");
    
    // Create a Hajj savings account with 1 ETH goal
    console.log("Creating Hajj savings account with 1 ETH goal...");
    try {
      const createAccountTx = await hajjContract.createAccount(ethers.utils.parseEther("1"));
      console.log(`Transaction hash: ${createAccountTx.hash}`);
      await createAccountTx.wait();
      console.log("Hajj account created successfully!");
    } catch (err) {
      console.log("Note: Account creation requires premium verification through ZK proof.");
      console.log("Error:", err.message);
    }
    
  } catch (err) {
    console.error("Error interacting with contracts:", err);
  }
}

main().catch(console.error);