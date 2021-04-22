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

const PHASE_ONE = 1;
const PHASE_TWO = 2;
const PHASE_THREE = 3;

contract("FeedRegistry Phases", function () {
  beforeEach(async function () {
    const FeedRegistryArtifact: Artifact = await hre.artifacts.readArtifact("FeedRegistry");
    this.registry = <FeedRegistry>await deployContract(this.signers.owner, FeedRegistryArtifact, []);
  });

  it("should initialize phase 0", async function () {
    const currentPhase = await this.registry.getCurrentPhase(ASSET, DENOMINATION);
    expect(currentPhase.id).to.equal(0);
    expect(currentPhase.aggregator).to.equal(ethers.constants.AddressZero);
    expect(currentPhase.startingAggregatorRoundId).to.equal(0);
    expect(currentPhase.endingAggregatorRoundId).to.equal(0);
  });

  // Tests phase logic when switching aggregators
  // Phase 1: Feed A is enabled from rounds 1 - 10
  // Phase 2: Feed B is enabled from rounds 123 - 156
  // Phase 3: Feed is set to zero address
  it("start and end round ids for previous & new aggregators should be captured in Phases", async function () {
    // Phase 1: Feed A is enabled from rounds 1 - 10
    const aggregatorArtifact: Artifact = await hre.artifacts.readArtifact("AggregatorV2V3Interface");
    const feedA = await deployMockContract(this.signers.owner, aggregatorArtifact.abi);
    const aStartingRound = BigNumber.from("1");
    await feedA.mock.latestRound.returns(aStartingRound); // Mock feed response
    await this.registry.proposeFeed(ASSET, DENOMINATION, feedA.address);
    await this.registry.confirmFeed(ASSET, DENOMINATION, feedA.address);

    const Phase1 = await this.registry.getCurrentPhase(ASSET, DENOMINATION);
    expect(Phase1.id).to.equal(PHASE_ONE);
    expect(Phase1.aggregator).to.equal(feedA.address);
    expect(Phase1.startingAggregatorRoundId).to.equal(aStartingRound);
    expect(Phase1.endingAggregatorRoundId).to.equal(0); // no previous aggregator
    expect(await this.registry.latestRound(ASSET, DENOMINATION)).to.equal(
      PHASE_BASE.mul(PHASE_ONE).add(aStartingRound),
    );

    // Phase 2: Feed B is enabled from rounds 123 - 156
    const feedB = await deployMockContract(this.signers.owner, aggregatorArtifact.abi);
    const bStartingRound = BigNumber.from("123");
    await feedB.mock.latestRound.returns(bStartingRound); // Mock feed response
    const aEndingRound = BigNumber.from("10");
    await feedA.mock.latestRound.returns(aEndingRound); // Simulate passing of time
    await this.registry.proposeFeed(ASSET, DENOMINATION, feedB.address);
    await this.registry.confirmFeed(ASSET, DENOMINATION, feedB.address);
    const endedPhase1 = await this.registry.getPhase(ASSET, DENOMINATION, PHASE_ONE);
    expect(endedPhase1.endingAggregatorRoundId).to.equal(aEndingRound); // feedA was previous phase aggregator

    const Phase2 = await this.registry.getCurrentPhase(ASSET, DENOMINATION);
    expect(Phase2.id).to.equal(PHASE_TWO);
    expect(Phase2.aggregator).to.equal(feedB.address);
    expect(Phase2.startingAggregatorRoundId).to.equal(bStartingRound);
    expect(Phase2.endingAggregatorRoundId).to.equal(0);
    expect(await this.registry.latestRound(ASSET, DENOMINATION)).to.equal(
      PHASE_BASE.mul(PHASE_TWO).add(bStartingRound),
    );

    // Phase 3: Feed is set to zero address
    const bEndingRound = BigNumber.from("156");
    await feedB.mock.latestRound.returns(bEndingRound); // Simulate passing of time
    const feedCAddress = ethers.constants.AddressZero;
    await this.registry.proposeFeed(ASSET, DENOMINATION, feedCAddress);
    await this.registry.confirmFeed(ASSET, DENOMINATION, feedCAddress);
    const endedPhase2 = await this.registry.getPhase(ASSET, DENOMINATION, PHASE_TWO);
    expect(endedPhase2.endingAggregatorRoundId).to.equal(bEndingRound); // feedB was previous phase aggregator

    const Phase3 = await this.registry.getCurrentPhase(ASSET, DENOMINATION);
    expect(Phase3.id).to.equal(PHASE_THREE);
    expect(Phase3.aggregator).to.equal(feedCAddress);
    expect(Phase3.startingAggregatorRoundId).to.equal(0);
    expect(Phase3.endingAggregatorRoundId).to.equal(0);
    await expect(this.registry.latestRound(ASSET, DENOMINATION)).to.be.revertedWith(
      "function call to a non-contract account",
    );

    // Check phase historical data is available
    const Phase1Data = await this.registry.getPhase(ASSET, DENOMINATION, PHASE_ONE);
    expect(Phase1Data.id).to.equal(PHASE_ONE);
    expect(Phase1Data.aggregator).to.equal(feedA.address);
    expect(Phase1Data.startingAggregatorRoundId).to.equal(aStartingRound);
    expect(Phase1Data.endingAggregatorRoundId).to.equal(aEndingRound);
    const Phase1RoundRange = await this.registry.getRoundIds(ASSET, DENOMINATION, PHASE_ONE);
    expect(Phase1RoundRange.startingRoundId).to.equal(PHASE_BASE.mul(PHASE_ONE).add(aStartingRound));
    expect(Phase1RoundRange.endingRoundId).to.equal(PHASE_BASE.mul(PHASE_ONE).add(aEndingRound));

    const Phase2Data = await this.registry.getPhase(ASSET, DENOMINATION, PHASE_TWO);
    expect(Phase2Data.id).to.equal(PHASE_TWO);
    expect(Phase2Data.aggregator).to.equal(feedB.address);
    expect(Phase2Data.startingAggregatorRoundId).to.equal(bStartingRound);
    expect(Phase2Data.endingAggregatorRoundId).to.equal(bEndingRound); // feedA was previous phase aggregator
    const Phase2RoundRange = await this.registry.getRoundIds(ASSET, DENOMINATION, PHASE_TWO);
    expect(Phase2RoundRange.startingRoundId).to.equal(PHASE_BASE.mul(PHASE_TWO).add(bStartingRound));
    expect(Phase2RoundRange.endingRoundId).to.equal(PHASE_BASE.mul(PHASE_TWO).add(bEndingRound));

    const Phase3Data = await this.registry.getPhase(ASSET, DENOMINATION, PHASE_THREE);
    expect(Phase3Data.id).to.equal(PHASE_THREE);
    expect(Phase3Data.aggregator).to.equal(ethers.constants.AddressZero);
    expect(Phase3Data.startingAggregatorRoundId).to.equal(0);
    expect(Phase3Data.endingAggregatorRoundId).to.equal(0);
    const Phase3RoundRange = await this.registry.getRoundIds(ASSET, DENOMINATION, PHASE_THREE);
    expect(Phase3RoundRange.startingRoundId).to.equal(PHASE_BASE.mul(PHASE_THREE).add(0));
    expect(Phase3RoundRange.endingRoundId).to.equal(PHASE_BASE.mul(PHASE_THREE).add(0));

    expect(
      await this.registry.getRoundFeed(ASSET, DENOMINATION, PHASE_BASE.mul(PHASE_ONE).add(aStartingRound)),
    ).to.equal(feedA.address);
    expect(
      await this.registry.getRoundFeed(ASSET, DENOMINATION, PHASE_BASE.mul(PHASE_ONE).add(aEndingRound.sub(1))),
    ).to.equal(feedA.address);
    expect(
      await this.registry.getRoundFeed(ASSET, DENOMINATION, PHASE_BASE.mul(PHASE_TWO).add(bStartingRound).add(1)),
    ).to.equal(feedB.address);
    expect(
      await this.registry.getRoundFeed(ASSET, DENOMINATION, PHASE_BASE.mul(PHASE_THREE).add(bEndingRound).add(1)),
    ).to.equal(feedCAddress);

    // TODO: test with invalid round
  });

  // TODO: test round helpers with active feed in current phase (latestRound())
});
