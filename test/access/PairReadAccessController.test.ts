import hre, { ethers } from "hardhat";
import { Artifact } from "hardhat/types";
import { expect } from "chai";
import { PairReadAccessController } from "../../typechain/PairReadAccessController";
import { TEST_ADDRESS, PAIR_DATA, BASE, QUOTE, EMPTY_BYTES } from "../utils/constants";
import { contract } from "../utils/context";

const { deployContract } = hre.waffle;

contract("PairReadAccessController", function () {
  beforeEach(async function () {
    const accessControllerArtifact: Artifact = await hre.artifacts.readArtifact("PairReadAccessController");
    this.controller = <PairReadAccessController>await deployContract(this.signers.owner, accessControllerArtifact, []);
    this.owned = this.controller;

    const FeedRegistryArtifact: Artifact = await hre.artifacts.readArtifact("FeedRegistry");
    const FeedRegistryInterface = new ethers.utils.Interface(FeedRegistryArtifact.abi);
    this.validRegistryCalldata = FeedRegistryInterface.encodeFunctionData("latestAnswer", [BASE, QUOTE]);

    const invalidABI = ["function transfer(address to, uint amount)"];
    const invalidInterface = new ethers.utils.Interface(invalidABI);
    this.invalidRegistryCalldata = invalidInterface.encodeFunctionData("transfer", [
      "0x1234567890123456789012345678901234567890",
      ethers.utils.parseEther("1.0"),
    ]);
  });

  it("allowlisted pair should return true", async function () {
    await this.controller.addLocalAccess(TEST_ADDRESS, PAIR_DATA);
    expect(await this.controller.hasAccess(TEST_ADDRESS, this.validRegistryCalldata)).to.equal(true);
  });

  it("global access should grant acess to all pairs", async function () {
    await this.controller.addGlobalAccess(TEST_ADDRESS);
    expect(await this.controller.hasAccess(TEST_ADDRESS, this.validRegistryCalldata)).to.equal(true);
  });

  it("invalid pair data should return false", async function () {
    expect(await this.controller.hasAccess(TEST_ADDRESS, this.invalidRegistryCalldata)).to.equal(false);
  });

  it("invalid decoded data should revert", async function () {
    await expect(this.controller.hasAccess(TEST_ADDRESS, EMPTY_BYTES)).to.be.revertedWith("");
  });
});
