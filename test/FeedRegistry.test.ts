import hre from "hardhat";
import { Artifact } from "hardhat/types";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/dist/src/signer-with-address";
import { FeedRegistry } from "../typechain/FeedRegistry";
import { Signers } from "../types";
import { expect } from "chai";
import { ethers, utils } from "ethers";
import { deployMockContract } from "ethereum-waffle";
import { shouldBehaveLikeOwned } from "./vendor/Owned.behaviour";

const { deployContract } = hre.waffle;
const ASSET_ADDRESS = "0x0000000000000000000000000000000000000001";
const DENOMINATION = utils.keccak256(utils.toUtf8Bytes("USD"));

describe("FeedRegistry", function () {
  beforeEach(async function () {
    this.signers = {} as Signers;
    const signers: SignerWithAddress[] = await hre.ethers.getSigners();
    this.signers.owner = signers[0];
    this.signers.other = signers[1];

    const registryArtifact: Artifact = await hre.artifacts.readArtifact("FeedRegistry");
    this.registry = <FeedRegistry>await deployContract(this.signers.owner, registryArtifact, []);
    this.owned = this.registry;

    const aggregatorArtifact: Artifact = await hre.artifacts.readArtifact("AggregatorV2V3Interface");
    this.feed = await deployMockContract(this.signers.owner, aggregatorArtifact.abi);
  });

  it("should initialize correctly", async function () {
    expect(await this.registry.owner()).to.equal(this.signers.owner.address);
  });

  it("owner can add a feed", async function () {
    await expect(this.registry.addFeeds([ASSET_ADDRESS], [DENOMINATION], [this.feed.address]))
      .to.emit(this.registry, "FeedSet")
      .withArgs(ASSET_ADDRESS, DENOMINATION, this.feed.address);

    const feed = await this.registry.getFeed(ASSET_ADDRESS, DENOMINATION);
    expect(feed).to.equal(this.feed.address);

    const isFeedEnabled = await this.registry.isFeedEnabled(feed);
    expect(isFeedEnabled);
  });

  it("subsequent add feeds should not emit events", async function () {
    await expect(this.registry.addFeeds([ASSET_ADDRESS], [DENOMINATION], [this.feed.address]))
      .to.emit(this.registry, "FeedSet")
      .withArgs(ASSET_ADDRESS, DENOMINATION, this.feed.address);
    await expect(this.registry.addFeeds([ASSET_ADDRESS], [DENOMINATION], [this.feed.address])).to.not.emit(
      this.registry,
      "FeedSet",
    );

    const feed = await this.registry.getFeed(ASSET_ADDRESS, DENOMINATION);
    expect(feed).to.equal(this.feed.address);
  });

  it("non-owners cannot add a feed", async function () {
    await expect(
      this.registry.connect(this.signers.other).addFeeds([ASSET_ADDRESS], [DENOMINATION], [this.feed.address]),
    ).to.be.revertedWith("Only callable by owner");
  });

  it("owner can remove a feed", async function () {
    await this.registry.addFeeds([ASSET_ADDRESS], [DENOMINATION], [this.feed.address]);
    await expect(this.registry.removeFeeds([ASSET_ADDRESS], [DENOMINATION]))
      .to.emit(this.registry, "FeedSet")
      .withArgs(ASSET_ADDRESS, DENOMINATION, ethers.constants.AddressZero);

    const feed = await this.registry.getFeed(ASSET_ADDRESS, DENOMINATION);
    expect(feed).to.equal(ethers.constants.AddressZero);

    const isFeedEnabled = await this.registry.isFeedEnabled(feed);
    expect(isFeedEnabled).to.equal(false);
  });

  it("non-owners cannot remove a feed", async function () {
    await this.registry.addFeeds([ASSET_ADDRESS], [DENOMINATION], [this.feed.address]);
    await expect(
      this.registry.connect(this.signers.other).removeFeeds([ASSET_ADDRESS], [DENOMINATION]),
    ).to.be.revertedWith("Only callable by owner");

    const feed = await this.registry.getFeed(ASSET_ADDRESS, DENOMINATION);
    expect(feed).to.equal(this.feed.address);
  });

  shouldBehaveLikeOwned();
});
