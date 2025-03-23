// check-state.js
const { ethers } = require('ethers');
require('dotenv').config();

async function main() {
  // Make sure private key is properly formatted
  const privateKey = process.env.PRIVATE_KEY.startsWith('0x') 
    ? process.env.PRIVATE_KEY 
    : `0x${process.env.PRIVATE_KEY}`;
  
  // Connect to Sepolia
  const provider = new ethers.providers.JsonRpcProvider(process.env.SEPOLIA_RPC_URL);
  const wallet = new ethers.Wallet(privateKey, provider);
  
  console.log(`Connected as: ${wallet.address}`);
  
  // Create contract instances
  const zakatAbi = [
    "function lastVerifiedAssets(address) view returns (uint256)",
    "function zakatContributions(address) view returns (uint256)"
  ];
  
  const zakatAddress = "0xe41279A05f3eEc58acDB7Df13De3148db912DFD5";
  const zakatContract = new ethers.Contract(zakatAddress, zakatAbi, provider);
  
  // Check current state
  const verifiedAssets = await zakatContract.lastVerifiedAssets(wallet.address);
  console.log(`Verified assets: ${ethers.utils.formatEther(verifiedAssets)} ETH`);
  
  const contributions = await zakatContract.zakatContributions(wallet.address);
  console.log(`Zakat contributions: ${ethers.utils.formatEther(contributions)} ETH`);
}

main().catch(console.error);