import hre from "hardhat";
import { Artifact } from "hardhat/types";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/dist/src/signer-with-address";

import { FeedRegistry } from "../typechain/FeedRegistry";
import { Signers } from "../types";
import { expect } from "chai";

const { deployContract } = hre.waffle;

describe("FeedRegistry", function () {
  before(async function () {
    this.signers = {} as Signers;
    const signers: SignerWithAddress[] = await hre.ethers.getSigners();
    this.signers.admin = signers[0];

    const registryArtifact: Artifact = await hre.artifacts.readArtifact("FeedRegistry");
    this.registry = <FeedRegistry>await deployContract(this.signers.admin, registryArtifact, []);
  });

  //   TODO
  it("should initialize correctly", async function () {
    expect(await this.registry.owner()).to.equal(this.signers.admin.address);
  });

  it("owner can add a feed", async function () {
    expect(true).to.equal(true);
  });

  it("non-owners cannot add a feed", async function () {
    expect(true).to.equal(true);
  });

  it("owner can remove a feed", async function () {
    expect(true).to.equal(true);
  });

  it("non-owners cannot remove a feed", async function () {
    expect(true).to.equal(true);
  });
});
