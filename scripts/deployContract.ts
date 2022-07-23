import { ethers } from "hardhat";

async function main() {
  const EvolvingTitan = await ethers.getContractFactory("EvolvingTitan");
  const evolvingTitan = await EvolvingTitan.deploy();

  await evolvingTitan.deployed();

  console.log("Contract deployed with address:", evolvingTitan.address);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
