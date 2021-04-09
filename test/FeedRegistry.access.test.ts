import hre from "hardhat";
import { Artifact } from "hardhat/types";
import { FeedRegistry } from "../typechain/FeedRegistry";
import { expect } from "chai";
import { deployMockContract } from "ethereum-waffle";
import { PairReadAccessController } from "../typechain/PairReadAccessController";
import { MockConsumer } from "../typechain/MockConsumer";
import { shouldBehaveLikeAccessControlled } from "./access/AccessControlled.behaviour";
import { ASSET_ADDRESS, DENOMINATION, TEST_ANSWER, PAIR_DATA } from "./utils/constants";
import { contract } from "./utils/context";

const { deployContract } = hre.waffle;

contract("FeedRegistry Access controls", function () {
  beforeEach(async function () {
    const FeedRegistryArtifact: Artifact = await hre.artifacts.readArtifact("FeedRegistry");
    this.registry = <FeedRegistry>await deployContract(this.signers.owner, FeedRegistryArtifact, []);
    this.accessControlled = this.registry;

    const aggregatorArtifact: Artifact = await hre.artifacts.readArtifact("AggregatorV2V3Interface");
    this.feed = await deployMockContract(this.signers.owner, aggregatorArtifact.abi);
    await this.registry.proposeFeed(ASSET_ADDRESS, DENOMINATION, this.feed.address);
    await this.registry.confirmFeed(ASSET_ADDRESS, DENOMINATION, this.feed.address);
    await this.feed.mock.latestAnswer.returns(TEST_ANSWER); // Mock feed response

    const accessControllerArtifact: Artifact = await hre.artifacts.readArtifact("PairReadAccessController");
    this.accessController = <PairReadAccessController>(
      await deployContract(this.signers.owner, accessControllerArtifact)
    );

    const consumerArtifact: Artifact = await hre.artifacts.readArtifact("MockConsumer");
    this.consumer = <MockConsumer>await deployContract(this.signers.owner, consumerArtifact, [this.registry.address]);
    expect(await this.consumer.getFeedRegistry()).to.equal(this.registry.address);
  });

  it("access controls should work for getter", async function () {
    // Access control is disabled when no controller is set
    expect(await this.registry.connect(this.signers.other).latestAnswer(ASSET_ADDRESS, DENOMINATION)).to.equal(
      TEST_ANSWER,
    );

    // Should revert because access is set to false by default, and access controllers checkEnabled defaults to true
    await this.registry.setController(this.accessController.address);
    expect(await this.accessController.hasAccess(this.consumer.address, PAIR_DATA)).to.equal(false);
    await expect(this.consumer.read(ASSET_ADDRESS, DENOMINATION)).to.be.revertedWith("No access");

    // Should pass because access is set to true
    await this.accessController.addLocalAccess(this.consumer.address, PAIR_DATA);
    expect(await this.accessController.hasAccess(this.consumer.address, PAIR_DATA)).to.equal(true);
    expect(await this.consumer.read(ASSET_ADDRESS, DENOMINATION)).to.equal(TEST_ANSWER);
  });

  shouldBehaveLikeAccessControlled();
});
