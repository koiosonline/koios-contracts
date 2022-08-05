import { ethers } from "hardhat";

async function main() {
  const TitanAchievements = await ethers.getContractFactory(
    "TitanAchievements"
  );
  const titanAchievements = await TitanAchievements.deploy();

  await titanAchievements.deployed();

  console.log("Contract deployed with address:", titanAchievements.address);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
