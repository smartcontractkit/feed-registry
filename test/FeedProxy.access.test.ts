import hre from "hardhat";
import { Artifact } from "hardhat/types";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/dist/src/signer-with-address";
import { FeedProxy } from "../typechain/FeedProxy";
import { Signers } from "../types";
import { expect } from "chai";
import { ethers, utils } from "ethers";
import { deployMockContract } from "ethereum-waffle";
import { PairReadAccessController } from "../typechain/PairReadAccessController";
import { MockConsumer } from "../typechain/MockConsumer";

const { deployContract } = hre.waffle;
const ASSET_ADDRESS = "0x0000000000000000000000000000000000000001";
const DENOMINATION = utils.keccak256(utils.toUtf8Bytes("USD")); // 0xc4ae21aac0c6549d71dd96035b7e0bdb6c79ebdba8891b666115bc976d16a29e
const PAIR_DATA = ethers.utils.defaultAbiCoder.encode(["address", "bytes32"], [ASSET_ADDRESS, DENOMINATION]);
const TEST_ANSWER = utils.parseEther("999999");

describe("FeedProxy Access controls", function () {
  beforeEach(async function () {
    this.signers = {} as Signers;
    const signers: SignerWithAddress[] = await hre.ethers.getSigners();
    this.signers.owner = signers[0];
    this.signers.other = signers[1];

    const feedProxyArtifact: Artifact = await hre.artifacts.readArtifact("FeedProxy");
    this.feedProxy = <FeedProxy>await deployContract(this.signers.owner, feedProxyArtifact, []);

    const aggregatorArtifact: Artifact = await hre.artifacts.readArtifact("AggregatorV2V3Interface");
    this.feed = await deployMockContract(this.signers.owner, aggregatorArtifact.abi);
    await this.feedProxy.addFeeds([ASSET_ADDRESS], [DENOMINATION], [this.feed.address]);
    await this.feed.mock.latestAnswer.returns(TEST_ANSWER); // Mock feed response

    const accessControllerArtifact: Artifact = await hre.artifacts.readArtifact("PairReadAccessController");
    this.accessController = <PairReadAccessController>(
      await deployContract(this.signers.owner, accessControllerArtifact)
    );

    const consumerArtifact: Artifact = await hre.artifacts.readArtifact("MockConsumer");
    this.consumer = <MockConsumer>await deployContract(this.signers.owner, consumerArtifact, [this.feedProxy.address]);
    expect(await this.consumer.getFeedProxy()).to.equal(this.feedProxy.address);
  });

  it("setController should set access controller for a feed", async function () {
    await this.feedProxy.setController(this.accessController.address);

    const accessController = await this.feedProxy.getAccessController();
    expect(accessController).to.equal(this.accessController.address);
  });

  it("setController should revert for a non-owners", async function () {
    await expect(
      this.feedProxy.connect(this.signers.other).setController(this.accessController.address),
    ).to.be.revertedWith("Only callable by owner");
  });

  it("access controls should work for getter", async function () {
    // Access control is disabled when no controller is set
    expect(await this.feedProxy.connect(this.signers.other).latestAnswer(ASSET_ADDRESS, DENOMINATION)).to.equal(
      TEST_ANSWER,
    );

    // Should revert because access is set to false by default, and access controllers checkEnabled defaults to true
    await this.feedProxy.setController(this.accessController.address);
    expect(await this.accessController.hasAccess(this.consumer.address, PAIR_DATA)).to.equal(false);
    await expect(this.consumer.read(ASSET_ADDRESS, DENOMINATION)).to.be.revertedWith("No access");

    // Should pass because access is set to true
    await this.accessController.addAccess(this.consumer.address, PAIR_DATA);
    expect(await this.accessController.hasAccess(this.consumer.address, PAIR_DATA)).to.equal(true);
    expect(await this.consumer.read(ASSET_ADDRESS, DENOMINATION)).to.equal(TEST_ANSWER);
  });
});
