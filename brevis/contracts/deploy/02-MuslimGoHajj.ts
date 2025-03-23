import * as dotenv from 'dotenv';
import { DeployFunction } from 'hardhat-deploy/types';
import { HardhatRuntimeEnvironment } from 'hardhat/types';

dotenv.config();

const deployFunc: DeployFunction = async (hre: HardhatRuntimeEnvironment) => {
  const { deployments, getNamedAccounts } = hre;
  const { deploy } = deployments;
  const { deployer } = await getNamedAccounts();

  // Use the same Brevis Request contract address as the existing deployment
  const args: string[] = ['0xa082F86d9d1660C29cf3f962A31d7D20E367154F']; // Sepolia Brevis Request Contract Address
  const deployment = await deploy('MuslimGoHajj', {
    from: deployer,
    log: true,
    args: args
  });

  console.log(`MuslimGoHajj deployed at: ${deployment.address}`);

  // Verify the contract on Etherscan
  try {
    await hre.run('verify:verify', {
      address: deployment.address,
      constructorArguments: args
    });
    console.log('Contract verified on Etherscan');
  } catch (error) {
    console.error('Error verifying contract:', error);
  }
};

deployFunc.tags = ['MuslimGoHajj'];
deployFunc.dependencies = [];
export default deployFunc;