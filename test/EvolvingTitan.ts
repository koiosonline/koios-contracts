import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { anyValue } from "@nomicfoundation/hardhat-chai-matchers/withArgs";
import { expect } from "chai";
import { ethers } from "hardhat";
import crypto from "crypto";

describe("EvolvingTitan", function () {
  // We define a fixture to reuse the same setup in every test.
  // We use loadFixture to run this setup once, snapshot that state,
  // and reset Hardhat Network to that snapshopt in every test.
  async function deployEvolvingTitanFixture() {
    // Contracts are deployed using the first signer/account by default
    const [owner, student_1, student_2] = await ethers.getSigners();

    const EvolvingTitan = await ethers.getContractFactory("EvolvingTitan");
    const contract = await EvolvingTitan.deploy();

    const _adminRoleByte = await contract.DEFAULT_ADMIN_ROLE();
    const _signerRoleByte = await contract.SIGNER_ROLE();
    const _transferRoleByte = await contract.TRANSFER_ROLE();

    // Prepare valid signature for
    const salt = crypto.randomBytes(16).toString("base64");
    const payload = ethers.utils.defaultAbiCoder.encode(
      ["string", "address", "address"],
      [salt, contract.address, student_1.address]
    );
    const payloadHash = ethers.utils.keccak256(payload);
    const token = await owner.signMessage(ethers.utils.arrayify(payloadHash));

    return {
      contract,
      owner,
      student_1,
      student_2,
      _adminRoleByte,
      _signerRoleByte,
      _transferRoleByte,
      salt,
      token,
    };
  }

  async function setSignerFixture() {
    // Contracts are deployed using the first signer/account by default
    const [owner, student_1, student_2] = await ethers.getSigners();

    const EvolvingTitan = await ethers.getContractFactory("EvolvingTitan");
    const contract = await EvolvingTitan.deploy();
    return {
      contract,
      owner,
      student_1,
      student_2,
    };
  }

  async function claimFixture() {
    // Contracts are deployed using the first signer/account by default
    const [owner, student_1, student_2] = await ethers.getSigners();

    const EvolvingTitan = await ethers.getContractFactory("EvolvingTitan");
    const contract = await EvolvingTitan.deploy();

    // Set the signer of the contract to the owner.address
    const signer = await contract.setSigner(owner.address);

    // Prepare valid signature for
    const salt = crypto.randomBytes(16).toString("base64");
    const payload = ethers.utils.defaultAbiCoder.encode(
      ["string", "address", "address"],
      [salt, contract.address, student_1.address]
    );
    const payloadHash = ethers.utils.keccak256(payload);
    const token = await owner.signMessage(ethers.utils.arrayify(payloadHash));

    return {
      contract,
      owner,
      student_1,
      student_2,
      salt,
      token,
      signer,
    };
  }

  describe("Deployment", function () {
    it("Should define the roles for this contract", async function () {
      const { contract, _adminRoleByte, _signerRoleByte, _transferRoleByte } =
        await loadFixture(deployEvolvingTitanFixture);

      console.log("admin: " + _adminRoleByte);
      console.log("signer: " + _signerRoleByte);
      console.log("transfer: " + _transferRoleByte);

      expect(await contract.DEFAULT_ADMIN_ROLE()).to.be.equal(_adminRoleByte);
      expect(await contract.SIGNER_ROLE()).to.be.equal(_signerRoleByte);
      expect(await contract.TRANSFER_ROLE()).to.be.equal(_transferRoleByte);
    });

    it("Should give the owner the DEFAULT_ADMIN_ROLE", async function () {
      const { contract, _adminRoleByte, owner } = await loadFixture(
        deployEvolvingTitanFixture
      );

      console.log("Admin role: " + _adminRoleByte);
      console.log("owner: " + owner.address);

      expect(await contract.getRoleMember(_adminRoleByte, 0)).to.be.equal(
        owner.address
      );
    });

    it("Should give the owner the SIGNER_ROLE", async function () {
      const { contract, _signerRoleByte, owner } = await loadFixture(
        deployEvolvingTitanFixture
      );

      console.log("Signer role: " + _signerRoleByte);
      console.log("owner: " + owner.address);

      expect(await contract.getRoleMember(_signerRoleByte, 0)).to.be.equal(
        owner.address
      );
    });

    it("Should give the owner the TRANSFER_ROLE", async function () {
      const { contract, _transferRoleByte, owner } = await loadFixture(
        deployEvolvingTitanFixture
      );

      console.log("Transfer role: " + _transferRoleByte);
      console.log("owner: " + owner.address);

      expect(await contract.getRoleMember(_transferRoleByte, 0)).to.be.equal(
        owner.address
      );
    });

    it("Should start with false for all addresses in the claimedNFT mapping", async function () {
      const { contract, token, salt, owner, student_1, student_2 } =
        await loadFixture(deployEvolvingTitanFixture);

      expect(await contract.claimedNFT(owner.address)).to.be.equal(false);
      expect(await contract.claimedNFT(student_1.address)).to.be.equal(false);
      expect(await contract.claimedNFT(student_2.address)).to.be.equal(false);
    });
  });

  describe("Signer", function () {
    it("Should emit a SignerUpdated event with the owner.address", async function () {
      const { contract, owner } = await loadFixture(setSignerFixture);

      expect(await contract.setSigner(owner.address))
        .to.emit(contract, "SignerUpdated")
        .withArgs(owner.address);
    });

    it("Should return true when verified", async function () {
      const { contract, owner, student_1 } = await loadFixture(
        setSignerFixture
      );

      // Set the signer of the contract to the owner.address
      await contract.setSigner(owner.address);

      // Prepare valid signature for
      const salt = crypto.randomBytes(16).toString("base64");
      const payload = ethers.utils.defaultAbiCoder.encode(
        ["string", "address", "address"],
        [salt, contract.address, student_1.address]
      );
      const payloadHash = ethers.utils.keccak256(payload);
      const token = await owner.signMessage(ethers.utils.arrayify(payloadHash));

      expect(
        await contract.verifyTokenForAddress(salt, token, student_1.address)
      ).to.be.equal(true);
    });
  });

  describe("Claim", function () {
    it("Should let student_1 claim a token, given correct signature", async function () {
      const { contract, token, salt, student_1, signer } = await loadFixture(
        claimFixture
      );

      console.log("signer: " + signer);
      expect(await contract.connect(student_1).claim(salt, token)).not.to.be
        .reverted;
      expect(await contract.balanceOf(student_1.address)).to.be.equal(1);
    });
  });
});
