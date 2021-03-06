import hre from "hardhat";
import { Artifact } from "hardhat/types";
import { FeedRegistry } from "../typechain/FeedRegistry";
import { expect } from "chai";
import { BASE, QUOTE, getRoundId } from "./utils/constants";
import { contract } from "./utils/context";
import { BigNumber, ethers } from "ethers";
import { deployMockContract } from "ethereum-waffle";

const { deployContract } = hre.waffle;

const ZERO = BigNumber.from(0);
const PHASE_ONE = 1;
const PHASE_TWO = 2;
const PHASE_THREE = 3;
const PHASE_FOUR = 4;

contract("FeedRegistry Phases", function () {
  beforeEach(async function () {
    const FeedRegistryArtifact: Artifact = await hre.artifacts.readArtifact("FeedRegistry");
    this.registry = <FeedRegistry>await deployContract(this.signers.owner, FeedRegistryArtifact, []);
  });

  it("should initialize phase 0", async function () {
    const currentPhaseId = await this.registry.getCurrentPhaseId(BASE, QUOTE);
    expect(currentPhaseId).to.equal(0);
    await expect(this.registry.getPhaseFeed(BASE, QUOTE, currentPhaseId)).to.be.revertedWith(
      "Feed not found for phase",
    );
  });

  it("getPhase() should revert for non-existent phases", async function () {
    await expect(this.registry.getPhase(BASE, QUOTE, PHASE_ONE)).to.be.revertedWith("Phase does not exist");
  });

  it("getPhaseRange() should revert for non-existent phases", async function () {
    await expect(this.registry.getPhaseRange(BASE, QUOTE, PHASE_ONE)).to.be.revertedWith("Phase does not exist");
  });

  // Tests phase logic when switching aggregators
  // Phase 1: Feed A is enabled from rounds 1 - 10
  // Phase 2: Feed B is enabled from rounds 123 - 156
  // Phase 3: Feed is set to zero address
  // Phase 4: Feed B is enabled
  it("start and end round ids for previous & new aggregators should be captured in Phases", async function () {
    // Phase 1: Feed A is enabled from rounds 1 - 10
    const aggregatorArtifact: Artifact = await hre.artifacts.readArtifact("AggregatorV2V3Interface");
    const feedA = await deployMockContract(this.signers.owner, aggregatorArtifact.abi);
    const feedAStartingRound = BigNumber.from("1");
    await feedA.mock.latestRound.returns(feedAStartingRound); // Mock feed latest round response
    await this.registry.proposeFeed(BASE, QUOTE, feedA.address);
    await this.registry.confirmFeed(BASE, QUOTE, feedA.address);

    expect(await this.registry.latestRound(BASE, QUOTE)).to.equal(getRoundId(PHASE_ONE, feedAStartingRound));
    const Phase1Id = await this.registry.getCurrentPhaseId(BASE, QUOTE);
    expect(Phase1Id).to.equal(PHASE_ONE);
    const Phase1Aggregator = await this.registry.getPhaseFeed(BASE, QUOTE, Phase1Id);
    expect(Phase1Aggregator).to.equal(feedA.address);
    const feedALatestRound = BigNumber.from("5");
    await feedA.mock.latestRound.returns(feedALatestRound); // Mock feed latest round response
    const Phase1RoundRange = await this.registry.getPhaseRange(BASE, QUOTE, Phase1Id);
    expect(Phase1RoundRange.startingRoundId).to.equal(getRoundId(PHASE_ONE, feedAStartingRound));
    expect(Phase1RoundRange.endingRoundId).to.equal(getRoundId(PHASE_ONE, feedALatestRound)); // latest feedA round
    const feedAEndingRound = BigNumber.from("10");
    await feedA.mock.latestRound.returns(feedAEndingRound); // Mock feed latest round response

    // Phase 2: Feed B is enabled from rounds 123 - 156
    const feedB = await deployMockContract(this.signers.owner, aggregatorArtifact.abi);
    const feedBStartingRound = BigNumber.from("123");
    await feedB.mock.latestRound.returns(feedBStartingRound); // Mock feed response
    await this.registry.proposeFeed(BASE, QUOTE, feedB.address);
    await this.registry.confirmFeed(BASE, QUOTE, feedB.address);
    const updatedPhase1RoundRange = await this.registry.getPhaseRange(BASE, QUOTE, Phase1Id);
    expect(updatedPhase1RoundRange.endingRoundId).to.equal(getRoundId(PHASE_ONE, feedAEndingRound)); // feedA was previous phase aggregator

    expect(await this.registry.latestRound(BASE, QUOTE)).to.equal(getRoundId(PHASE_TWO, feedBStartingRound));
    const Phase2Id = await this.registry.getCurrentPhaseId(BASE, QUOTE);
    expect(Phase2Id).to.equal(PHASE_TWO);
    const Phase2Aggregator = await this.registry.getPhaseFeed(BASE, QUOTE, Phase2Id);
    expect(Phase2Aggregator).to.equal(feedB.address);
    const feedBLatestRound = BigNumber.from("150");
    await feedB.mock.latestRound.returns(feedBLatestRound); // Mock feed latest round response
    const Phase2RoundRange = await this.registry.getPhaseRange(BASE, QUOTE, Phase2Id);
    expect(Phase2RoundRange.startingRoundId).to.equal(getRoundId(PHASE_TWO, feedBStartingRound));
    expect(Phase2RoundRange.endingRoundId).to.equal(getRoundId(PHASE_TWO, feedBLatestRound)); // latest feedB round
    const feedBEndingRound = BigNumber.from("156");
    await feedB.mock.latestRound.returns(feedBEndingRound); // Mock feed latest round response

    // Phase 3: Feed is set to zero address
    const feedCAddress = ethers.constants.AddressZero;
    await this.registry.proposeFeed(BASE, QUOTE, feedCAddress);
    await this.registry.confirmFeed(BASE, QUOTE, feedCAddress);
    const endedPhase2 = await this.registry.getPhase(BASE, QUOTE, PHASE_TWO);
    expect(endedPhase2.endingAggregatorRoundId).to.equal(feedBEndingRound); // feedB was previous phase aggregator

    const Phase3Id = await this.registry.getCurrentPhaseId(BASE, QUOTE);
    expect(Phase3Id).to.equal(PHASE_THREE);
    await expect(this.registry.getPhaseFeed(BASE, QUOTE, Phase3Id)).to.be.revertedWith(
      "Feed not found for phase", // zero address
    );
    const Phase3RoundRange = await this.registry.getPhaseRange(BASE, QUOTE, Phase3Id);
    expect(Phase3RoundRange.startingRoundId).to.equal(getRoundId(PHASE_THREE, ZERO));
    expect(Phase3RoundRange.endingRoundId).to.equal(getRoundId(PHASE_THREE, ZERO));
    await expect(this.registry.latestRound(BASE, QUOTE)).to.be.revertedWith("Feed not found");

    // Phase 4: Feed B is enabled after a zero address phase
    const feedBNewStartingRound = BigNumber.from("1123");
    await feedB.mock.latestRound.returns(feedBNewStartingRound); // Mock feed response
    await this.registry.proposeFeed(BASE, QUOTE, feedB.address);
    await this.registry.confirmFeed(BASE, QUOTE, feedB.address);
    const updatedPhase3RoundRange = await this.registry.getPhaseRange(BASE, QUOTE, Phase3Id);
    expect(updatedPhase3RoundRange.endingRoundId).to.equal(getRoundId(PHASE_THREE, ZERO)); // zero address latest round is 0

    expect(await this.registry.latestRound(BASE, QUOTE)).to.equal(getRoundId(PHASE_FOUR, feedBNewStartingRound));
    const Phase4Id = await this.registry.getCurrentPhaseId(BASE, QUOTE);
    expect(Phase4Id).to.equal(PHASE_FOUR);
    const Phase4Aggregator = await this.registry.getPhaseFeed(BASE, QUOTE, Phase4Id);
    expect(Phase4Aggregator).to.equal(feedB.address);
    const feedBNewLatestRound = BigNumber.from("1050");
    await feedB.mock.latestRound.returns(feedBNewLatestRound); // Mock feed latest round response
    const Phase4RoundRange = await this.registry.getPhaseRange(BASE, QUOTE, Phase4Id);
    expect(Phase4RoundRange.startingRoundId).to.equal(getRoundId(PHASE_FOUR, feedBNewStartingRound));
    expect(Phase4RoundRange.endingRoundId).to.equal(getRoundId(PHASE_FOUR, feedBNewLatestRound)); // latest feedB round

    // Check phase historical data is available
    const Phase1Data = await this.registry.getPhase(BASE, QUOTE, PHASE_ONE);
    expect(Phase1Data.startingAggregatorRoundId).to.equal(feedAStartingRound);
    expect(Phase1Data.endingAggregatorRoundId).to.equal(feedAEndingRound);

    const Phase2Data = await this.registry.getPhase(BASE, QUOTE, PHASE_TWO);
    expect(Phase2Data.startingAggregatorRoundId).to.equal(feedBStartingRound);
    expect(Phase2Data.endingAggregatorRoundId).to.equal(feedBEndingRound); // feedA was previous phase aggregator

    const Phase3Data = await this.registry.getPhase(BASE, QUOTE, PHASE_THREE);
    expect(Phase3Data.startingAggregatorRoundId).to.equal(0);
    expect(Phase3Data.endingAggregatorRoundId).to.equal(0);

    const Phase4Data = await this.registry.getPhase(BASE, QUOTE, PHASE_FOUR);
    expect(Phase4Data.startingAggregatorRoundId).to.equal(feedBNewStartingRound);
    expect(Phase4Data.endingAggregatorRoundId).to.equal(0); // phase has not ended

    expect(await this.registry.getRoundFeed(BASE, QUOTE, getRoundId(PHASE_ONE, feedAStartingRound))).to.equal(
      feedA.address,
    );
    expect(await this.registry.getRoundFeed(BASE, QUOTE, getRoundId(PHASE_ONE, feedAEndingRound.sub(1)))).to.equal(
      feedA.address,
    );
    expect(await this.registry.getRoundFeed(BASE, QUOTE, getRoundId(PHASE_TWO, feedBStartingRound.add(1)))).to.equal(
      feedB.address,
    );
    await expect(
      this.registry.getRoundFeed(BASE, QUOTE, getRoundId(PHASE_THREE, feedBEndingRound.add(1))),
    ).to.be.revertedWith(
      "Feed not found for round", // zero address
    );
  });

  it("should be able to inspect active feed in current phase", async function () {
    // Phase 1: Feed A is enabled from rounds 1 - 10
    const aggregatorArtifact: Artifact = await hre.artifacts.readArtifact("AggregatorV2V3Interface");
    const feedA = await deployMockContract(this.signers.owner, aggregatorArtifact.abi);
    const aStartingRound = BigNumber.from("1");
    await feedA.mock.latestRound.returns(aStartingRound); // Mock feed response
    await this.registry.proposeFeed(BASE, QUOTE, feedA.address);
    await this.registry.confirmFeed(BASE, QUOTE, feedA.address);
    const aLatestRound = BigNumber.from("10");
    await feedA.mock.latestRound.returns(aLatestRound);

    const Phase = await this.registry.getPhaseRange(BASE, QUOTE, PHASE_ONE);
    expect(Phase.startingRoundId).to.equal(getRoundId(PHASE_ONE, aStartingRound));
    expect(Phase.endingRoundId).to.equal(getRoundId(PHASE_ONE, aLatestRound));
    expect(await this.registry.getRoundFeed(BASE, QUOTE, getRoundId(PHASE_ONE, aLatestRound))).to.equal(feedA.address);
  });

  it("retrieving a feed by an invalid round id should revert", async function () {
    // Phase 1: Feed A is enabled from rounds 1 - 10
    const aggregatorArtifact: Artifact = await hre.artifacts.readArtifact("AggregatorV2V3Interface");
    const feedA = await deployMockContract(this.signers.owner, aggregatorArtifact.abi);
    const aStartingRound = BigNumber.from("1");
    await feedA.mock.latestRound.returns(aStartingRound); // Mock feed response
    await this.registry.proposeFeed(BASE, QUOTE, feedA.address);
    await this.registry.confirmFeed(BASE, QUOTE, feedA.address);

    // End phase 1
    const aLatestRound = BigNumber.from("10");
    await feedA.mock.latestRound.returns(aLatestRound);
    await this.registry.proposeFeed(BASE, QUOTE, ethers.constants.AddressZero);
    await this.registry.confirmFeed(BASE, QUOTE, ethers.constants.AddressZero);

    await expect(
      this.registry.getRoundFeed(BASE, QUOTE, getRoundId(PHASE_ONE, aLatestRound).add(1)),
    ).to.be.revertedWith("Feed not found for round");
    await expect(this.registry.getRoundFeed(BASE, QUOTE, getRoundId(PHASE_TWO, BigNumber.from(1)))).to.be.revertedWith(
      "Feed not found for round",
    );
  });
});
