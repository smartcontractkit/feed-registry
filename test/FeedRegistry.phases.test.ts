import hre from "hardhat";
import { Artifact } from "hardhat/types";
import { FeedRegistry } from "../typechain/FeedRegistry";
import { expect } from "chai";
import {
  ASSET,
  DENOMINATION,
  TEST_ANSWER,
  PAIR_DATA,
  TEST_ROUND_DATA,
  TEST_ROUND,
  PHASE_BASE,
} from "./utils/constants";
import { contract } from "./utils/context";
import { BigNumber, ethers } from "ethers";
import { deployMockContract } from "ethereum-waffle";

const { deployContract } = hre.waffle;

contract("FeedRegistry Phases", function () {
  beforeEach(async function () {
    const FeedRegistryArtifact: Artifact = await hre.artifacts.readArtifact("FeedRegistry");
    this.registry = <FeedRegistry>await deployContract(this.signers.owner, FeedRegistryArtifact, []);
  });

  it("should initialize current phase", async function () {
    const currentPhase = await this.registry.getCurrentPhase(ASSET, DENOMINATION);
    expect(currentPhase.id).to.equal(0);
    expect(currentPhase.aggregator).to.equal(ethers.constants.AddressZero);
    expect(currentPhase.startingRoundId).to.equal(0);
    expect(currentPhase.endingRoundId).to.equal(0);
  });

  // Tests phase logic when switching aggregators
  it("start and end round ids for previous & new aggregators should be captured in Phases", async function () {
    // Phase 1: Feed A is enabled from rounds 1 - 10
    // Phase 2: Feed B is enabled from rounds 123 - 156
    // Phase 3: Feed is set to zero address

    // Set A as aggregator
    const aggregatorArtifact: Artifact = await hre.artifacts.readArtifact("AggregatorV2V3Interface");
    const feedA = await deployMockContract(this.signers.owner, aggregatorArtifact.abi);
    const aStartingRound = BigNumber.from("1");
    await feedA.mock.latestRound.returns(aStartingRound); // Mock feed response
    await this.registry.proposeFeed(ASSET, DENOMINATION, feedA.address);
    await this.registry.confirmFeed(ASSET, DENOMINATION, feedA.address);

    const Phase1 = await this.registry.getCurrentPhase(ASSET, DENOMINATION);
    expect(Phase1.id).to.equal(1);
    expect(Phase1.aggregator).to.equal(feedA.address);
    expect(Phase1.startingRoundId).to.equal(aStartingRound);
    expect(Phase1.endingRoundId).to.equal(0); // no previous aggregator
    expect(await this.registry.latestRound(ASSET, DENOMINATION)).to.equal(PHASE_BASE.add(aStartingRound));

    // Set B as aggregator
    const feedB = await deployMockContract(this.signers.owner, aggregatorArtifact.abi);
    const bStartingRound = BigNumber.from("123");
    await feedB.mock.latestRound.returns(bStartingRound); // Mock feed response
    const aEndingRound = BigNumber.from("10");
    await feedA.mock.latestRound.returns(aEndingRound); // Simulate passing of time
    await this.registry.proposeFeed(ASSET, DENOMINATION, feedB.address);
    await this.registry.confirmFeed(ASSET, DENOMINATION, feedB.address);

    const Phase2 = await this.registry.getCurrentPhase(ASSET, DENOMINATION);
    expect(Phase2.id).to.equal(2);
    expect(Phase2.aggregator).to.equal(feedB.address);
    expect(Phase2.startingRoundId).to.equal(bStartingRound);
    expect(Phase2.endingRoundId).to.equal(0);
    const endedPhase1 = await this.registry.getPhase(ASSET, DENOMINATION, 1);
    expect(endedPhase1.endingRoundId).to.equal(aEndingRound); // feedA was previous phase aggregator
    expect(await this.registry.latestRound(ASSET, DENOMINATION)).to.equal(PHASE_BASE.mul(2).add(bStartingRound));

    // Set to zero address
    const bEndingRound = BigNumber.from("156");
    await feedB.mock.latestRound.returns(bEndingRound); // Simulate passing of time
    await this.registry.proposeFeed(ASSET, DENOMINATION, ethers.constants.AddressZero);
    await this.registry.confirmFeed(ASSET, DENOMINATION, ethers.constants.AddressZero);

    const Phase3 = await this.registry.getCurrentPhase(ASSET, DENOMINATION);
    expect(Phase3.id).to.equal(3);
    expect(Phase3.aggregator).to.equal(ethers.constants.AddressZero);
    expect(Phase3.startingRoundId).to.equal(0);
    expect(Phase3.endingRoundId).to.equal(0);
    const endedPhase2 = await this.registry.getPhase(ASSET, DENOMINATION, 2);
    expect(endedPhase2.endingRoundId).to.equal(bEndingRound); // feedB was previous phase aggregator
    await expect(this.registry.latestRound(ASSET, DENOMINATION)).to.be.revertedWith(
      "function call to a non-contract account",
    );

    // Check historical data is available
    const Phase1Data = await this.registry.getPhase(ASSET, DENOMINATION, 1);
    expect(Phase1Data.id).to.equal(1);
    expect(Phase1Data.aggregator).to.equal(feedA.address);
    expect(Phase1Data.startingRoundId).to.equal(aStartingRound);
    expect(Phase1Data.endingRoundId).to.equal(aEndingRound);

    const Phase2Data = await this.registry.getPhase(ASSET, DENOMINATION, 2);
    expect(Phase2Data.id).to.equal(2);
    expect(Phase2Data.aggregator).to.equal(feedB.address);
    expect(Phase2Data.startingRoundId).to.equal(bStartingRound);
    expect(Phase2Data.endingRoundId).to.equal(bEndingRound); // feedA was previous phase aggregator

    const Phase3Data = await this.registry.getPhase(ASSET, DENOMINATION, 3);
    expect(Phase3Data.id).to.equal(3);
    expect(Phase3Data.aggregator).to.equal(ethers.constants.AddressZero);
    expect(Phase3Data.startingRoundId).to.equal(0);
    expect(Phase3Data.endingRoundId).to.equal(0);

    // TODO: Helpers to more easily access phase id + round id ranges
  });
});
