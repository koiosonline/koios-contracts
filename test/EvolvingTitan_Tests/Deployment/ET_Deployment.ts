import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { expect } from "chai";
import { ethers } from "hardhat";

describe("Evoling Titan Deployment Tests", function () {
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

    return {
      contract,
      owner,
      student_1,
      student_2,
      _adminRoleByte,
      _signerRoleByte,
      _transferRoleByte,
    };
  }

  it("Should define the roles for this contract", async function () {
    const { contract, _adminRoleByte, _signerRoleByte, _transferRoleByte } =
      await loadFixture(deployEvolvingTitanFixture);

    expect(await contract.DEFAULT_ADMIN_ROLE()).to.be.equal(_adminRoleByte);
    expect(await contract.SIGNER_ROLE()).to.be.equal(_signerRoleByte);
    expect(await contract.TRANSFER_ROLE()).to.be.equal(_transferRoleByte);
  });

  it("Should give the owner the DEFAULT_ADMIN_ROLE", async function () {
    const { contract, _adminRoleByte, owner } = await loadFixture(
      deployEvolvingTitanFixture
    );

    expect(await contract.getRoleMember(_adminRoleByte, 0)).to.be.equal(
      owner.address
    );
  });

  it("Should give the owner the SIGNER_ROLE", async function () {
    const { contract, _signerRoleByte, owner } = await loadFixture(
      deployEvolvingTitanFixture
    );

    expect(await contract.getRoleMember(_signerRoleByte, 0)).to.be.equal(
      owner.address
    );
  });

  it("Should give the owner the TRANSFER_ROLE", async function () {
    const { contract, _transferRoleByte, owner } = await loadFixture(
      deployEvolvingTitanFixture
    );
    expect(await contract.getRoleMember(_transferRoleByte, 0)).to.be.equal(
      owner.address
    );
  });

  it("Should start with false for any addresses in the claimedNFT mapping", async function () {
    const { contract, owner, student_1, student_2 } = await loadFixture(
      deployEvolvingTitanFixture
    );

    expect(await contract.claimedNFT(owner.address)).to.be.equal(false);
    expect(await contract.claimedNFT(student_1.address)).to.be.equal(false);
    expect(await contract.claimedNFT(student_2.address)).to.be.equal(false);
  });

  it("Should correctly set the name and symbol for the contract ", async function () {
    const { contract } = await loadFixture(deployEvolvingTitanFixture);

    expect(await contract.name()).to.be.equal("KOIOS Evolving Titan");
    expect(await contract.symbol()).to.be.equal("eTITAN");
  });
});
