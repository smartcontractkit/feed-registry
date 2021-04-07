import hre from "hardhat";
import { Artifact } from "hardhat/types";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/dist/src/signer-with-address";
import { Signers } from "../../types";
import { expect } from "chai";
import { ethers } from "ethers";
import { WriteAccessController } from "../../typechain/WriteAccessController";
import { shouldBehaveLikeOwned } from "../vendor/Owned.behaviour";

const { deployContract } = hre.waffle;
const TEST_ADDRESS = "0x0000000000000000000000000000000000000002";
const ASSET_ADDRESS = "0x0000000000000000000000000000000000000001";
const DENOMINATION = 1;
const OTHER_DENOMINATION = 2;
const TEST_DATA = ethers.utils.defaultAbiCoder.encode(["address", "uint256"], [ASSET_ADDRESS, DENOMINATION]);
const OTHER_TEST_DATA = ethers.utils.defaultAbiCoder.encode(
  ["address", "uint256"],
  [ASSET_ADDRESS, OTHER_DENOMINATION],
);
const EMPTY_BYTES = "0x";

describe("WriteAccessController", function () {
  beforeEach(async function () {
    this.signers = {} as Signers;
    const signers: SignerWithAddress[] = await hre.ethers.getSigners();
    this.signers.owner = signers[0];
    this.signers.other = signers[1];

    const accessControllerArtifact: Artifact = await hre.artifacts.readArtifact("WriteAccessController");
    this.controller = <WriteAccessController>await deployContract(this.signers.owner, accessControllerArtifact, []);
    this.owned = this.controller;
  });

  it("checks should be enabled initially", async function () {
    expect(await this.controller.checkEnabled()).to.equal(true);
    expect(await this.controller.owner()).to.equal(this.signers.owner.address);
  });

  it("owner can add global access", async function () {
    expect(await this.controller.hasAccess(TEST_ADDRESS, EMPTY_BYTES)).to.equal(false);
    await expect(this.controller.addGlobalAccess(TEST_ADDRESS))
      .to.emit(this.controller, "AccessAdded")
      .withArgs(TEST_ADDRESS, EMPTY_BYTES);

    expect(await this.controller.hasAccess(TEST_ADDRESS, EMPTY_BYTES)).to.equal(true);
    expect(await this.controller.hasAccess(TEST_ADDRESS, TEST_DATA)).to.equal(true); // Also grants local access
    expect(await this.controller.hasAccess(TEST_ADDRESS, OTHER_TEST_DATA)).to.equal(true);
  });

  it("non-owners cannot add global access", async function () {
    await expect(this.controller.connect(this.signers.other).addGlobalAccess(TEST_ADDRESS)).to.be.revertedWith(
      "Only callable by owner",
    );
  });

  it("owner can add local access", async function () {
    expect(await this.controller.hasAccess(TEST_ADDRESS, TEST_DATA)).to.equal(false);
    await expect(this.controller.addLocalAccess(TEST_ADDRESS, TEST_DATA))
      .to.emit(this.controller, "AccessAdded")
      .withArgs(TEST_ADDRESS, TEST_DATA);

    expect(await this.controller.hasAccess(TEST_ADDRESS, TEST_DATA)).to.equal(true);
    expect(await this.controller.hasAccess(TEST_ADDRESS, EMPTY_BYTES)).to.equal(false); // Does not grant global access
    expect(await this.controller.hasAccess(TEST_ADDRESS, OTHER_TEST_DATA)).to.equal(false);
  });

  it("non-owners cannot add local access", async function () {
    await expect(
      this.controller.connect(this.signers.other).addLocalAccess(TEST_ADDRESS, TEST_DATA),
    ).to.be.revertedWith("Only callable by owner");
  });

  it("owner can remove global access", async function () {
    await this.controller.addGlobalAccess(TEST_ADDRESS); // Add global access
    expect(await this.controller.hasAccess(TEST_ADDRESS, EMPTY_BYTES)).to.equal(true);

    await expect(this.controller.removeGlobalAccess(TEST_ADDRESS))
      .to.emit(this.controller, "AccessRemoved")
      .withArgs(TEST_ADDRESS, EMPTY_BYTES);

    expect(await this.controller.hasAccess(TEST_ADDRESS, EMPTY_BYTES)).to.equal(false);
  });

  it("non-owners cannot remove global access", async function () {
    await this.controller.addGlobalAccess(TEST_ADDRESS); // Add global access
    await expect(this.controller.connect(this.signers.other).removeGlobalAccess(TEST_ADDRESS)).to.be.revertedWith(
      "Only callable by owner",
    );
  });

  it("owner can remove local access", async function () {
    await this.controller.addLocalAccess(TEST_ADDRESS, TEST_DATA); // Add local access
    expect(await this.controller.hasAccess(TEST_ADDRESS, TEST_DATA)).to.equal(true);

    await expect(this.controller.removeLocalAccess(TEST_ADDRESS, TEST_DATA))
      .to.emit(this.controller, "AccessRemoved")
      .withArgs(TEST_ADDRESS, TEST_DATA);

    expect(await this.controller.hasAccess(TEST_ADDRESS, TEST_DATA)).to.equal(false);
  });

  it("non-owners cannot remove local access", async function () {
    await this.controller.addLocalAccess(TEST_ADDRESS, TEST_DATA); // Add local access
    await expect(
      this.controller.connect(this.signers.other).removeLocalAccess(TEST_ADDRESS, TEST_DATA),
    ).to.be.revertedWith("Only callable by owner");
  });

  it("removing global access does not remove local access", async function () {
    await this.controller.addGlobalAccess(TEST_ADDRESS); // Add global access
    await this.controller.addLocalAccess(TEST_ADDRESS, TEST_DATA); // Add local access
    expect(await this.controller.hasAccess(TEST_ADDRESS, EMPTY_BYTES)).to.equal(true);
    expect(await this.controller.hasAccess(TEST_ADDRESS, TEST_DATA)).to.equal(true);

    await this.controller.removeGlobalAccess(TEST_ADDRESS);
    expect(await this.controller.hasAccess(TEST_ADDRESS, EMPTY_BYTES)).to.equal(false);
    expect(await this.controller.hasAccess(TEST_ADDRESS, TEST_DATA)).to.equal(true); // Local access remains
  });

  it("removing local access does not remove global access", async function () {
    await this.controller.addGlobalAccess(TEST_ADDRESS); // Add global access
    await this.controller.addLocalAccess(TEST_ADDRESS, TEST_DATA); // Add local access
    expect(await this.controller.hasAccess(TEST_ADDRESS, EMPTY_BYTES)).to.equal(true);
    expect(await this.controller.hasAccess(TEST_ADDRESS, TEST_DATA)).to.equal(true);

    await this.controller.removeLocalAccess(TEST_ADDRESS, TEST_DATA);
    expect(await this.controller.hasAccess(TEST_ADDRESS, EMPTY_BYTES)).to.equal(true); // Global access remains
    expect(await this.controller.hasAccess(TEST_ADDRESS, TEST_DATA)).to.equal(true);
  });

  it("owner can disable and enable access check", async function () {
    expect(await this.controller.checkEnabled()).to.equal(true);
    expect(await this.controller.hasAccess(TEST_ADDRESS, EMPTY_BYTES)).to.equal(false);

    await this.controller.disableAccessCheck();
    expect(await this.controller.checkEnabled()).to.equal(false);
    expect(await this.controller.hasAccess(TEST_ADDRESS, EMPTY_BYTES)).to.equal(true);

    await this.controller.enableAccessCheck();
    expect(await this.controller.checkEnabled()).to.equal(true);
    expect(await this.controller.hasAccess(TEST_ADDRESS, EMPTY_BYTES)).to.equal(false);
  });

  shouldBehaveLikeOwned();
});
