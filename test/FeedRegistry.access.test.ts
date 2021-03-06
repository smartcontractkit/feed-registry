import hre from "hardhat";
import { Artifact } from "hardhat/types";
import { FeedRegistry } from "../typechain/FeedRegistry";
import { expect } from "chai";
import { PairReadAccessController } from "../typechain/PairReadAccessController";
import { MockConsumer } from "../typechain/MockConsumer";
import { shouldBehaveLikeAccessControlled } from "./access/AccessControlled.behaviour";
import { BASE, QUOTE, PAIR_DATA, TEST_ANSWER, TEST_ROUND } from "./utils/constants";
import { contract } from "./utils/context";
import { deployMockAggregator } from "./utils/mocks";

const { deployContract } = hre.waffle;

contract("FeedRegistry Access controls", function () {
  beforeEach(async function () {
    const FeedRegistryArtifact: Artifact = await hre.artifacts.readArtifact("FeedRegistry");
    this.registry = <FeedRegistry>await deployContract(this.signers.owner, FeedRegistryArtifact, []);
    this.accessControlled = this.registry;

    this.feed = await deployMockAggregator(this.signers.owner);
    await this.feed.mock.latestAnswer.returns(TEST_ANSWER);
    await this.feed.mock.latestRound.returns(TEST_ROUND);

    await this.registry.proposeFeed(BASE, QUOTE, this.feed.address);
    await this.registry.confirmFeed(BASE, QUOTE, this.feed.address);

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
    expect(await this.registry.connect(this.signers.other).latestAnswer(BASE, QUOTE)).to.equal(TEST_ANSWER);
    const encodedRegistryCall = this.registry.interface.encodeFunctionData("latestAnswer", [BASE, QUOTE]);

    // Should revert because access is set to false by default, and access controllers checkEnabled defaults to true
    await this.registry.setAccessController(this.accessController.address);
    expect(await this.accessController.hasAccess(this.consumer.address, encodedRegistryCall)).to.equal(false);
    await expect(this.consumer.read(BASE, QUOTE)).to.be.revertedWith("No access");

    // Should pass because access is set to true
    await this.accessController.addLocalAccess(this.consumer.address, PAIR_DATA);
    expect(await this.accessController.hasAccess(this.consumer.address, encodedRegistryCall)).to.equal(true);
    expect(await this.consumer.read(BASE, QUOTE)).to.equal(TEST_ANSWER);
  });

  shouldBehaveLikeAccessControlled();
});
