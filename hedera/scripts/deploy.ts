import { network } from "hardhat";

const { ethers } = await network.connect({
  network: "testnet"
});

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deploying contract with the account:", deployer.address);

  const SplitPayReceipts = await ethers.getContractFactory("SplitPayReceipts", deployer);
  const splitPayReceipts = await SplitPayReceipts.deploy();

  await splitPayReceipts.waitForDeployment();

  const address = await splitPayReceipts.getAddress();
  console.log("SplitPayReceipts Contract deployed at:", address);
}

main().catch(console.error);