import hre from "hardhat";
import { Artifact } from "hardhat/types";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/dist/src/signer-with-address";
import { Signers } from "../../types";
import { expect } from "chai";
import { ethers, utils } from "ethers";
import { PairReadAccessController } from "../../typechain/PairReadAccessController";

const { deployContract } = hre.waffle;
const TEST_ADDRESS = "0x0000000000000000000000000000000000000002";
const ASSET_ADDRESS = "0x0000000000000000000000000000000000000001";
const DENOMINATION = utils.keccak256(utils.toUtf8Bytes("USD"));
const PAIR_DATA = ethers.utils.defaultAbiCoder.encode(["address", "bytes32"], [ASSET_ADDRESS, DENOMINATION]);
const INVALID_PAIR_DATA = ethers.utils.defaultAbiCoder.encode(["address", "int256"], [ASSET_ADDRESS, "123"]);
const EMPTY_BYTES = "0x";

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
    await this.controller.addAccess(TEST_ADDRESS, PAIR_DATA);
    expect(await this.controller.hasAccess(TEST_ADDRESS, PAIR_DATA)).to.equal(true);
  });

  it("global access should grant acess to all pairs", async function () {
    await this.controller.addAccess(TEST_ADDRESS, EMPTY_BYTES);
    expect(await this.controller.hasAccess(TEST_ADDRESS, PAIR_DATA)).to.equal(true);
  });

  it("invalid pair data should return false", async function () {
    expect(await this.controller.hasAccess(TEST_ADDRESS, INVALID_PAIR_DATA)).to.equal(false);
  });
});