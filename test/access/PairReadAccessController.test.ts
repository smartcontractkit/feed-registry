import hre from "hardhat";
import { Artifact } from "hardhat/types";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/dist/src/signer-with-address";
import { Signers } from "../../types";
import { expect } from "chai";
import { PairReadAccessController } from "../../typechain/PairReadAccessController";
import { INVALID_PAIR_DATA, PAIR_DATA, TEST_ADDRESS } from "../utils/constants";

const { deployContract } = hre.waffle;

describe("PairReadAccessController", function () {
  beforeEach(async function () {
    this.signers = {} as Signers;
    const signers: SignerWithAddress[] = await hre.ethers.getSigners();
    this.signers.owner = signers[0];
    this.signers.other = signers[1];

    const accessControllerArtifact: Artifact = await hre.artifacts.readArtifact("PairReadAccessController");
    this.controller = <PairReadAccessController>await deployContract(this.signers.owner, accessControllerArtifact, []);
    this.owned = this.controller;
  });

  it("allowlisted pair should return true", async function () {
    await this.controller.addLocalAccess(TEST_ADDRESS, PAIR_DATA);
    expect(await this.controller.hasAccess(TEST_ADDRESS, PAIR_DATA)).to.equal(true);
  });

  it("global access should grant acess to all pairs", async function () {
    await this.controller.addGlobalAccess(TEST_ADDRESS);
    expect(await this.controller.hasAccess(TEST_ADDRESS, PAIR_DATA)).to.equal(true);
  });

  it("invalid pair data should return false", async function () {
    expect(await this.controller.hasAccess(TEST_ADDRESS, INVALID_PAIR_DATA)).to.equal(false);
  });
});
