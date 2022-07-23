import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { expect } from "chai";
import { ethers } from "hardhat";
import crypto from "crypto";

describe("Titan Achievements Function Tests", function () {
  async function setSignerFixture() {
    // Contracts are deployed using the first signer/account by default
    const [owner, student_1, student_2] = await ethers.getSigners();

    const TitanAchievements = await ethers.getContractFactory(
      "TitanAchievements"
    );
    const contract = await TitanAchievements.deploy();
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

    const TitanAchievements = await ethers.getContractFactory(
      "TitanAchievements"
    );
    const contract = await TitanAchievements.deploy();

    // Set the signer of the contract to the owner.address
    const signer = await contract.setSigner(owner.address);

    // Prepare valid signature for
    const tokenIdToMint = 1;
    const salt = crypto.randomBytes(16).toString("base64");
    const payload = ethers.utils.defaultAbiCoder.encode(
      ["string", "address", "address", "uint256"],
      [salt, contract.address, student_1.address, tokenIdToMint]
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
      tokenIdToMint,
    };
  }

  async function transferFixture() {
    // Contracts are deployed using the first signer/account by default
    const [owner, student_1, student_2] = await ethers.getSigners();

    const TitanAchievements = await ethers.getContractFactory(
      "TitanAchievements"
    );
    const contract = await TitanAchievements.deploy();

    // Prepare signer role bytes
    const _transferRoleByte = await contract.TRANSFER_ROLE();

    // Set the signer of the contract to the owner.address
    const signer = await contract.setSigner(owner.address);

    // Prepare valid signature for student_1
    const tokenIdToMint = 1;
    const salt = crypto.randomBytes(16).toString("base64");
    const payload = ethers.utils.defaultAbiCoder.encode(
      ["string", "address", "address", "uint256"],
      [salt, contract.address, student_1.address, tokenIdToMint]
    );
    const payloadHash = ethers.utils.keccak256(payload);
    const token = await owner.signMessage(ethers.utils.arrayify(payloadHash));

    // Prepare valid signature for student_2
    const tokenIdToMint2 = 2;
    const salt2 = crypto.randomBytes(16).toString("base64");
    const payload2 = ethers.utils.defaultAbiCoder.encode(
      ["string", "address", "address", "uint256"],
      [salt2, contract.address, student_2.address, tokenIdToMint2]
    );
    const payloadHash2 = ethers.utils.keccak256(payload2);
    const token2 = await owner.signMessage(ethers.utils.arrayify(payloadHash2));

    // Mint a token for student_1
    await contract.connect(student_1).claim(salt, token, tokenIdToMint);

    // Mint a token for student_2
    await contract.connect(student_2).claim(salt2, token2, tokenIdToMint2);

    return {
      contract,
      owner,
      student_1,
      student_2,
      signer,
      _transferRoleByte,
      tokenIdToMint,
      tokenIdToMint2,
    };
  }

  describe("Signer Tests", function () {
    it("Should return true when verified", async function () {
      const { contract, owner, student_1 } = await loadFixture(
        setSignerFixture
      );

      // Set the signer of the contract to the owner.address
      await contract.setSigner(owner.address);

      // Prepare valid signature for
      const tokenIdToMint = 1;
      const salt = crypto.randomBytes(16).toString("base64");
      const payload = ethers.utils.defaultAbiCoder.encode(
        ["string", "address", "address", "uint256"],
        [salt, contract.address, student_1.address, tokenIdToMint]
      );
      const payloadHash = ethers.utils.keccak256(payload);
      const token = await owner.signMessage(ethers.utils.arrayify(payloadHash));

      expect(
        await contract["verifyTokenForAddress(string,bytes,address,uint256)"](
          salt,
          token,
          student_1.address,
          tokenIdToMint
        )
      ).to.be.equal(true);
    });

    it("Should revert when a non Signer address tries to update signer", async function () {
      const { contract, student_1, student_2 } = await loadFixture(
        setSignerFixture
      );

      expect(contract.connect(student_1).setSigner(student_2.address))
        .to.be.revertedWithCustomError(contract, "PermissionDenied")
        .withArgs("Caller is not a signer", student_1.address);
    });
  });

  describe("Claim Tests", function () {
    it("Should let student_1 claim a token, given correct signature", async function () {
      const { contract, token, salt, student_1, tokenIdToMint } =
        await loadFixture(claimFixture);
      expect(
        await contract.connect(student_1).claim(salt, token, tokenIdToMint)
      ).not.to.be.reverted;
      expect(
        await contract.balanceOf(student_1.address, tokenIdToMint)
      ).to.be.equal(1);
    });

    it("Should emit a tokenMinted event after claim", async function () {
      const { contract, token, salt, student_1, tokenIdToMint } =
        await loadFixture(claimFixture);

      // Claim a token
      const tx = await contract
        .connect(student_1)
        .claim(salt, token, tokenIdToMint);

      expect(tx).not.to.be.reverted;
      expect(tx).to.emit(contract, "tokenMinted").withArgs(tx.value, tx.to);
      expect(
        await contract.balanceOf(student_1.address, tokenIdToMint)
      ).to.be.equal(1);
    });

    it("Should revert transaction, given incorrect signature", async function () {
      const { contract, salt, student_1, tokenIdToMint } = await loadFixture(
        claimFixture
      );

      const invalidSignature =
        "0x346a39d20604ded0e99e102010ce5cc7de5510e420adba18e00487425841058817eed03ae59038b9bfab518ee51029de930cda1a1cdba111b244215144f704c51b";

      expect(
        contract.connect(student_1).claim(salt, invalidSignature, tokenIdToMint)
      )
        .to.be.revertedWithCustomError(contract, "InvalidSignature")
        .withArgs(salt, invalidSignature, tokenIdToMint, student_1.address);
      expect(
        await contract.balanceOf(student_1.address, tokenIdToMint)
      ).to.be.equal(0);
    });

    it("Should revert transaction, given student_1 has already claimed", async function () {
      const { contract, salt, student_1, token, tokenIdToMint } =
        await loadFixture(claimFixture);

      // Claim one NFT
      await contract.connect(student_1).claim(salt, token, tokenIdToMint);

      expect(contract.connect(student_1).claim(salt, token, tokenIdToMint))
        .to.be.revertedWithCustomError(contract, "AddressAlreadyClaimed")
        .withArgs(student_1.address);
      expect(
        await contract.balanceOf(student_1.address, tokenIdToMint)
      ).to.be.equal(1);
    });
  });

  describe("Transfer Tests", function () {
    it("Should revert when non-transferrer calls either transfer functions", async function () {
      const { contract, owner, student_1, tokenIdToMint } = await loadFixture(
        transferFixture
      );

      expect(
        contract
          .connect(student_1)
          .safeTransferFrom(
            student_1.address,
            owner.address,
            tokenIdToMint,
            1,
            []
          )
      )
        .to.be.revertedWithCustomError(contract, "PermissionDenied")
        .withArgs("Caller is not a transferrer", student_1.address);
      expect(
        contract.safeBatchTransferFrom(
          student_1.address,
          owner.address,
          [1],
          [1],
          []
        )
      )
        .to.be.revertedWithCustomError(contract, "PermissionDenied")
        .withArgs("Caller is not a transferrer", student_1.address);
    });

    it("Should complete when a transferrer tries to transfer", async function () {
      const { contract, owner, student_2, tokenIdToMint2, _transferRoleByte } =
        await loadFixture(transferFixture);

      // Give student_2 the transfer role
      await contract
        .connect(owner)
        .grantRole(_transferRoleByte, student_2.address);

      expect(
        await contract
          .connect(student_2)
          .safeTransferFrom(
            student_2.address,
            owner.address,
            tokenIdToMint2,
            1,
            []
          )
      ).not.to.be.reverted;

      expect(
        await contract
          .connect(owner)
          .safeBatchTransferFrom(
            owner.address,
            student_2.address,
            [tokenIdToMint2],
            [1],
            []
          )
      ).not.to.be.reverted;

      expect(
        await contract.balanceOf(owner.address, tokenIdToMint2)
      ).to.be.equal(0);
      expect(
        await contract.balanceOf(student_2.address, tokenIdToMint2)
      ).to.be.equal(1);
    });
  });
});
