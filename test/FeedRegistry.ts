import hre from "hardhat";
import { Artifact } from "hardhat/types";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/dist/src/signer-with-address";
import { FeedRegistry } from "../typechain/FeedRegistry";
import { Signers } from "../types";
import { expect } from "chai";
import { ethers, utils } from "ethers";
import { deployMockContract } from "ethereum-waffle";
import { shouldBehaveLikeOwned } from "./Owned.behaviour";

const { deployContract } = hre.waffle;
const ASSET_ADDRESS = "0x0000000000000000000000000000000000000001";
const USD = utils.keccak256(utils.toUtf8Bytes("USD"));
const TEST_PRICE = utils.parseEther("999999");

describe("FeedRegistry", function () {
  beforeEach(async function () {
    this.signers = {} as Signers;
    const signers: SignerWithAddress[] = await hre.ethers.getSigners();
    this.signers.owner = signers[0];
    this.signers.stranger = signers[1];

    const registryArtifact: Artifact = await hre.artifacts.readArtifact("FeedRegistry");
    this.registry = <FeedRegistry>await deployContract(this.signers.owner, registryArtifact, []);

    const aggregatorArtifact: Artifact = await hre.artifacts.readArtifact("AggregatorV2V3Interface");
    this.feed = await deployMockContract(this.signers.owner, aggregatorArtifact.abi);
  });

  it("should initialize correctly", async function () {
    expect(await this.registry.owner()).to.equal(this.signers.owner.address);
  });

  it("owner can add a feed", async function () {
    await expect(this.registry.addFeeds([ASSET_ADDRESS], [USD], [this.feed.address]))
      .to.emit(this.registry, "FeedUpdated")
      .withArgs(ASSET_ADDRESS, USD, this.feed.address);

    const feed = await this.registry.getFeed(ASSET_ADDRESS, USD);
    expect(feed).to.equal(this.feed.address);
  });

  it("subsequent add feeds should not emit events", async function () {
    await expect(this.registry.addFeeds([ASSET_ADDRESS], [USD], [this.feed.address]))
      .to.emit(this.registry, "FeedUpdated")
      .withArgs(ASSET_ADDRESS, USD, this.feed.address);
    await expect(this.registry.addFeeds([ASSET_ADDRESS], [USD], [this.feed.address])).to.not.emit(
      this.registry,
      "FeedUpdated",
    );

    const feed = await this.registry.getFeed(ASSET_ADDRESS, USD);
    expect(feed).to.equal(this.feed.address);
  });

  it("non-owners cannot add a feed", async function () {
    await expect(
      this.registry.connect(this.signers.stranger).addFeeds([ASSET_ADDRESS], [USD], [this.feed.address]),
    ).to.be.revertedWith("Only callable by owner");
  });

  it("owner can remove a feed", async function () {
    await this.registry.addFeeds([ASSET_ADDRESS], [USD], [this.feed.address]);
    await expect(this.registry.removeFeeds([ASSET_ADDRESS], [USD]))
      .to.emit(this.registry, "FeedUpdated")
      .withArgs(ASSET_ADDRESS, USD, ethers.constants.AddressZero);

    const feed = await this.registry.getFeed(ASSET_ADDRESS, USD);
    expect(feed).to.equal(ethers.constants.AddressZero);
  });

  it("non-owners cannot remove a feed", async function () {
    await this.registry.addFeeds([ASSET_ADDRESS], [USD], [this.feed.address]);
    await expect(this.registry.connect(this.signers.stranger).removeFeeds([ASSET_ADDRESS], [USD])).to.be.revertedWith(
      "Only callable by owner",
    );

    const feed = await this.registry.getFeed(ASSET_ADDRESS, USD);
    expect(feed).to.equal(this.feed.address);
  });

  shouldBehaveLikeOwned();
});
