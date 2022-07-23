import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { expect } from "chai";
import { ethers } from "hardhat";
import crypto from "crypto";

describe("Evolving Titan Metadata Tests", function () {
  async function metadataFixture() {
    // Contracts are deployed using the first signer/account by default
    const [owner, student_1, student_2] = await ethers.getSigners();

    const TitanAchievements = await ethers.getContractFactory(
      "TitanAchievements"
    );
    const contract = await TitanAchievements.deploy();

    const _adminRoleByte = await contract.DEFAULT_ADMIN_ROLE();

    // Prepare valid signature for
    const tokenIdToMint = 1;
    const salt = crypto.randomBytes(16).toString("base64");
    const payload = ethers.utils.defaultAbiCoder.encode(
      ["string", "address", "address", "uint256"],
      [salt, contract.address, student_1.address, tokenIdToMint]
    );
    const payloadHash = ethers.utils.keccak256(payload);
    const token = await owner.signMessage(ethers.utils.arrayify(payloadHash));

    // Set signer to owner.address
    const signer = await contract.setSigner(owner.address);

    return {
      contract,
      owner,
      student_1,
      student_2,
      _adminRoleByte,
      salt,
      token,
      tokenIdToMint,
    };
  }

  it("Should not let a non-admin address update base URI", async function () {
    const { contract, student_1 } = await loadFixture(metadataFixture);

    expect(contract.connect(student_1).setBaseURI("https://newbaseuri.io/"))
      .to.be.revertedWithCustomError(contract, "PermissionDenied")
      .withArgs("Caller is not an admin", student_1.address);
  });

  it("Should not let a non-admin address update token URI", async function () {
    const { contract, student_1 } = await loadFixture(metadataFixture);

    expect(
      contract.connect(student_1).setTokenURI(1, "https://newtokenuri.io/")
    )
      .to.be.revertedWithCustomError(contract, "PermissionDenied")
      .withArgs("Caller is not an admin", student_1.address);
  });

  it("Should let an admin address update base URI", async function () {
    const { contract, owner } = await loadFixture(metadataFixture);

    expect(contract.connect(owner).setBaseURI("https://newbaseuri.io/")).not.to
      .be.reverted;
  });

  it("Should return empty string if no tokenId URI has been set", async function () {
    const { contract, owner } = await loadFixture(metadataFixture);

    await contract.connect(owner).setBaseURI("https://newbaseuri.io/");

    expect(await contract.uri(1)).to.be.equal("");
  });

  it("Should let an admin address update token URI", async function () {
    const { contract, owner } = await loadFixture(metadataFixture);

    expect(contract.connect(owner).setTokenURI(1, "1.json")).not.to.be.reverted;
  });

  it("Should return URI for given token if all has been set", async function () {
    const { contract, owner } = await loadFixture(metadataFixture);

    await contract.connect(owner).setBaseURI("https://newbaseuri.io/");

    await contract.connect(owner).setTokenURI(1, "1.json");

    expect(await contract.uri(1)).to.be.equal("https://newbaseuri.io/1.json");
  });
});
