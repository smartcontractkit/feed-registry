import hre from "hardhat";
import { Artifact } from "hardhat/types";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/dist/src/signer-with-address";

import { FeedRegistry } from "../typechain/FeedRegistry";
import { Signers } from "../types";
import { expect } from "chai";
import { ethers, utils } from "ethers";

const { deployContract } = hre.waffle;

const ASSET_ADDRESS = "0x0000000000000000000000000000000000000001"
const PROXY_ADDRESS = "0x0000000000000000000000000000000000000002"
const USD = utils.keccak256(utils.toUtf8Bytes("USD"))

describe("FeedRegistry", function () {
  before(async function () {
    this.signers = {} as Signers;
    const signers: SignerWithAddress[] = await hre.ethers.getSigners();
    this.signers.admin = signers[0];
    this.signers.stranger = signers[1];    

    const registryArtifact: Artifact = await hre.artifacts.readArtifact("FeedRegistry");
    this.registry = <FeedRegistry>await deployContract(this.signers.admin, registryArtifact, []);
  });

  it("should initialize correctly", async function () {
    expect(await this.registry.owner()).to.equal(this.signers.admin.address);
  });

  it("owner can add a feed", async function () {
    await this.registry.addFeed(ASSET_ADDRESS, USD, PROXY_ADDRESS);
    await expect(this.registry.addFeed(ASSET_ADDRESS, USD, PROXY_ADDRESS))
    .to.emit(this.registry, 'FeedAdded')
    .withArgs(ASSET_ADDRESS, USD, PROXY_ADDRESS);
  

    const feed = await this.registry.getFeed(ASSET_ADDRESS, USD);
    expect(feed).to.equal(PROXY_ADDRESS)
  });

  it("non-owners cannot add a feed", async function () {
    await expect(this.registry.connect(this.signers.stranger).addFeed(ASSET_ADDRESS, USD, PROXY_ADDRESS)).to.be.revertedWith('Only callable by owner');
  });

  it("owner can remove a feed", async function () {
    await this.registry.addFeed(ASSET_ADDRESS, USD, PROXY_ADDRESS);
    await expect(this.registry.removeFeed(ASSET_ADDRESS, USD))
    .to.emit(this.registry, 'FeedRemoved')
    .withArgs(ASSET_ADDRESS, USD, PROXY_ADDRESS);    

    const feed = await this.registry.getFeed(ASSET_ADDRESS, USD);
    expect(feed).to.equal(ethers.constants.AddressZero)
  });

  it("non-owners cannot remove a feed", async function () {
    await this.registry.addFeed(ASSET_ADDRESS, USD, PROXY_ADDRESS);
    await expect(this.registry.connect(this.signers.stranger).removeFeed(ASSET_ADDRESS, USD)).to.be.revertedWith('Only callable by owner');
    
    const feed = await this.registry.getFeed(ASSET_ADDRESS, USD);
    expect(feed).to.equal(PROXY_ADDRESS)    
  });
});
