import hre from "hardhat";
import { Artifact } from "hardhat/types";
import { FeedRegistry } from "../typechain/FeedRegistry";
import { expect } from "chai";
import { ASSET, DENOMINATION, getRoundId } from "./utils/constants";
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

  it.only("should initialize phase 0", async function () {
    const currentPhaseId = await this.registry.getCurrentPhaseId(ASSET, DENOMINATION);
    const currentPhaseAggregator = await this.registry.getPhaseFeed(ASSET, DENOMINATION, currentPhaseId);
    const currentPhaseRoundRange = await this.registry.getPhaseRange(ASSET, DENOMINATION, currentPhaseId);
    expect(currentPhaseId).to.equal(0);
    expect(currentPhaseAggregator).to.equal(ethers.constants.AddressZero);
    expect(currentPhaseRoundRange.startingRoundId).to.equal(0);
    expect(currentPhaseRoundRange.endingRoundId).to.equal(0);
  });

  // // Tests phase logic when switching aggregators
  // // Phase 1: Feed A is enabled from rounds 1 - 10
  // // Phase 2: Feed B is enabled from rounds 123 - 156
  // // Phase 3: Feed is set to zero address
  // it("start and end round ids for previous & new aggregators should be captured in Phases", async function () {
  //   // Phase 1: Feed A is enabled from rounds 1 - 10
  //   const aggregatorArtifact: Artifact = await hre.artifacts.readArtifact("AggregatorV2V3Interface");
  //   const feedA = await deployMockContract(this.signers.owner, aggregatorArtifact.abi);
  //   const aStartingRound = BigNumber.from("1");
  //   await feedA.mock.latestRound.returns(aStartingRound); // Mock feed response
  //   await this.registry.proposeFeed(ASSET, DENOMINATION, feedA.address);
  //   await this.registry.confirmFeed(ASSET, DENOMINATION, feedA.address);

  //   const Phase1Id = await this.registry.getCurrentPhaseId(ASSET, DENOMINATION)
  //   const Phase1Aggregator = await this.registry.getPhaseFeed(ASSET, DENOMINATION, Phase1Id)
  //   const Phase1RoundRange = await this.registry.getPhaseRange(ASSET, DENOMINATION, Phase1Id);
  //   expect(Phase1Id).to.equal(PHASE_ONE);
  //   expect(Phase1Aggregator).to.equal(feedA.address);
  //   expect(Phase1RoundRange.startingAggregatorRoundId).to.equal(aStartingRound);
  //   expect(Phase1RoundRange.endingAggregatorRoundId).to.equal(0); // no previous aggregator
  //   expect(await this.registry.latestRound(ASSET, DENOMINATION)).to.equal(getRoundId(PHASE_ONE, aStartingRound));
  //   const aEndingRound = BigNumber.from("10");
  //   await feedA.mock.latestRound.returns(aEndingRound); // Simulate passing of time

  //   // Phase 2: Feed B is enabled from rounds 123 - 156
  //   const feedB = await deployMockContract(this.signers.owner, aggregatorArtifact.abi);
  //   const bStartingRound = BigNumber.from("123");
  //   await feedB.mock.latestRound.returns(bStartingRound); // Mock feed response
  //   await this.registry.proposeFeed(ASSET, DENOMINATION, feedB.address);
  //   await this.registry.confirmFeed(ASSET, DENOMINATION, feedB.address);
  //   const endedPhase1 = await this.registry.getPhase(ASSET, DENOMINATION, PHASE_ONE);
  //   expect(endedPhase1.endingAggregatorRoundId).to.equal(aEndingRound); // feedA was previous phase aggregator

  //   const Phase2 = await this.registry.getCurrentPhase(ASSET, DENOMINATION);
  //   expect(Phase2.id).to.equal(PHASE_TWO);
  //   expect(Phase2.aggregator).to.equal(feedB.address);
  //   expect(Phase2.startingAggregatorRoundId).to.equal(bStartingRound);
  //   expect(Phase2.endingAggregatorRoundId).to.equal(0);
  //   expect(await this.registry.latestRound(ASSET, DENOMINATION)).to.equal(getRoundId(PHASE_TWO, bStartingRound));
  //   const bEndingRound = BigNumber.from("156");
  //   await feedB.mock.latestRound.returns(bEndingRound); // Simulate passing of time

  //   // Phase 3: Feed is set to zero address
  //   const feedCAddress = ethers.constants.AddressZero;
  //   await this.registry.proposeFeed(ASSET, DENOMINATION, feedCAddress);
  //   await this.registry.confirmFeed(ASSET, DENOMINATION, feedCAddress);
  //   const endedPhase2 = await this.registry.getPhase(ASSET, DENOMINATION, PHASE_TWO);
  //   expect(endedPhase2.endingAggregatorRoundId).to.equal(bEndingRound); // feedB was previous phase aggregator

  //   const Phase3 = await this.registry.getCurrentPhase(ASSET, DENOMINATION);
  //   expect(Phase3.id).to.equal(PHASE_THREE);
  //   expect(Phase3.aggregator).to.equal(feedCAddress);
  //   expect(Phase3.startingAggregatorRoundId).to.equal(0);
  //   expect(Phase3.endingAggregatorRoundId).to.equal(0);
  //   await expect(this.registry.latestRound(ASSET, DENOMINATION)).to.be.revertedWith(
  //     "function call to a non-contract account",
  //   );

  //   // Check phase historical data is available
  //   const Phase1Data = await this.registry.getPhase(ASSET, DENOMINATION, PHASE_ONE);
  //   expect(Phase1Data.id).to.equal(PHASE_ONE);
  //   expect(Phase1Data.aggregator).to.equal(feedA.address);
  //   expect(Phase1Data.startingAggregatorRoundId).to.equal(aStartingRound);
  //   expect(Phase1Data.endingAggregatorRoundId).to.equal(aEndingRound);

  //   const Phase2Data = await this.registry.getPhase(ASSET, DENOMINATION, PHASE_TWO);
  //   expect(Phase2Data.id).to.equal(PHASE_TWO);
  //   expect(Phase2Data.aggregator).to.equal(feedB.address);
  //   expect(Phase2Data.startingAggregatorRoundId).to.equal(bStartingRound);
  //   expect(Phase2Data.endingAggregatorRoundId).to.equal(bEndingRound); // feedA was previous phase aggregator

  //   const Phase3Data = await this.registry.getPhase(ASSET, DENOMINATION, PHASE_THREE);
  //   expect(Phase3Data.id).to.equal(PHASE_THREE);
  //   expect(Phase3Data.aggregator).to.equal(ethers.constants.AddressZero);
  //   expect(Phase3Data.startingAggregatorRoundId).to.equal(0);
  //   expect(Phase3Data.endingAggregatorRoundId).to.equal(0);

  //   expect(await this.registry.getRoundFeed(ASSET, DENOMINATION, getRoundId(PHASE_ONE, aStartingRound))).to.equal(
  //     feedA.address,
  //   );
  //   expect(await this.registry.getRoundFeed(ASSET, DENOMINATION, getRoundId(PHASE_ONE, aEndingRound.sub(1)))).to.equal(
  //     feedA.address,
  //   );
  //   expect(
  //     await this.registry.getRoundFeed(ASSET, DENOMINATION, getRoundId(PHASE_TWO, bStartingRound.add(1))),
  //   ).to.equal(feedB.address);
  //   expect(
  //     await this.registry.getRoundFeed(ASSET, DENOMINATION, getRoundId(PHASE_THREE, bEndingRound.add(1))),
  //   ).to.equal(feedCAddress);
  // });

  // it("should be able to inspect active feed in current phase", async function () {
  //   // Phase 1: Feed A is enabled from rounds 1 - 10
  //   const aggregatorArtifact: Artifact = await hre.artifacts.readArtifact("AggregatorV2V3Interface");
  //   const feedA = await deployMockContract(this.signers.owner, aggregatorArtifact.abi);
  //   const aStartingRound = BigNumber.from("1");
  //   await feedA.mock.latestRound.returns(aStartingRound); // Mock feed response
  //   await this.registry.proposeFeed(ASSET, DENOMINATION, feedA.address);
  //   await this.registry.confirmFeed(ASSET, DENOMINATION, feedA.address);
  //   const aLatestRound = BigNumber.from("10");
  //   await feedA.mock.latestRound.returns(aLatestRound);

  //   const phaseRoundRange = await this.registry.getPhaseRange(ASSET, DENOMINATION, PHASE_ONE);
  //   expect(phaseRoundRange.startingRoundId).to.equal(getRoundId(PHASE_ONE, aStartingRound));
  //   expect(phaseRoundRange.endingRoundId).to.equal(getRoundId(PHASE_ONE, aLatestRound));
  //   expect(await this.registry.getRoundFeed(ASSET, DENOMINATION, getRoundId(PHASE_ONE, aLatestRound))).to.equal(
  //     feedA.address,
  //   );
  // });

  // it("retrieving a feed by an invalid round id should return zero address", async function () {
  //   // Phase 1: Feed A is enabled from rounds 1 - 10
  //   const aggregatorArtifact: Artifact = await hre.artifacts.readArtifact("AggregatorV2V3Interface");
  //   const feedA = await deployMockContract(this.signers.owner, aggregatorArtifact.abi);
  //   const aStartingRound = BigNumber.from("1");
  //   await feedA.mock.latestRound.returns(aStartingRound); // Mock feed response
  //   await this.registry.proposeFeed(ASSET, DENOMINATION, feedA.address);
  //   await this.registry.confirmFeed(ASSET, DENOMINATION, feedA.address);

  //   // End phase 1
  //   const aLatestRound = BigNumber.from("10");
  //   await feedA.mock.latestRound.returns(aLatestRound);
  //   await this.registry.proposeFeed(ASSET, DENOMINATION, ethers.constants.AddressZero);
  //   await this.registry.confirmFeed(ASSET, DENOMINATION, ethers.constants.AddressZero);

  //   expect(await this.registry.getRoundFeed(ASSET, DENOMINATION, getRoundId(PHASE_ONE, aLatestRound).add(1))).to.equal(
  //     ethers.constants.AddressZero,
  //   );
  //   expect(await this.registry.getRoundFeed(ASSET, DENOMINATION, getRoundId(PHASE_TWO, BigNumber.from(1)))).to.equal(
  //     ethers.constants.AddressZero,
  //   );
  // });
});
