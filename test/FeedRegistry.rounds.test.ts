import hre from "hardhat";
import { Artifact } from "hardhat/types";
import { FeedRegistry } from "../typechain/FeedRegistry";
import { expect } from "chai";
import { ASSET, DENOMINATION, PHASE_BASE } from "./utils/constants";
import { contract } from "./utils/context";
import { BigNumber, ethers } from "ethers";
import { deployMockContract } from "ethereum-waffle";

const { deployContract } = hre.waffle;

const PHASE_ONE = 1;
const PHASE_TWO = 2;
const PHASE_THREE = 3;
const PHASE_FOUR = 4;
const ZERO = BigNumber.from("0");
const A_STARTING_ROUND = BigNumber.from("1");
const A_ENDING_ROUND = BigNumber.from("10");
const B_STARTING_ROUND = BigNumber.from("123");
const B_ENDING_ROUND = BigNumber.from("156");
const D_STARTING_ROUND = BigNumber.from("40");
const D_LATEST_ROUND = BigNumber.from("51");
const getRoundId = (phase: number, roundId: BigNumber) => PHASE_BASE.mul(phase).add(roundId);

contract("FeedRegistry rounds", function () {
  beforeEach(async function () {
    const FeedRegistryArtifact: Artifact = await hre.artifacts.readArtifact("FeedRegistry");
    this.registry = <FeedRegistry>await deployContract(this.signers.owner, FeedRegistryArtifact, []);

    // Phase 1: Feed A is enabled from rounds 1 - 10
    // Phase 2: Feed B is enabled from rounds 123 - 156
    // Phase 3: Feed is set to zero address
    // Phase 4: Feed D is enabled from rounds 40 - 51 (latest)
    const aggregatorArtifact: Artifact = await hre.artifacts.readArtifact("AggregatorV2V3Interface");
    this.feedA = await deployMockContract(this.signers.owner, aggregatorArtifact.abi);
    await this.feedA.mock.latestRound.returns(A_STARTING_ROUND); // Mock feed response
    await this.registry.proposeFeed(ASSET, DENOMINATION, this.feedA.address);
    await this.registry.confirmFeed(ASSET, DENOMINATION, this.feedA.address);
    this.aEndingRound = BigNumber.from("10");
    await this.feedA.mock.latestRound.returns(A_ENDING_ROUND); // Simulate passing of time

    this.feedB = await deployMockContract(this.signers.owner, aggregatorArtifact.abi);
    await this.feedB.mock.latestRound.returns(B_STARTING_ROUND); // Mock feed response
    await this.registry.proposeFeed(ASSET, DENOMINATION, this.feedB.address);
    await this.registry.confirmFeed(ASSET, DENOMINATION, this.feedB.address);
    await this.feedB.mock.latestRound.returns(B_ENDING_ROUND); // Simulate passing of time

    const feedCAddress = ethers.constants.AddressZero;
    await this.registry.proposeFeed(ASSET, DENOMINATION, feedCAddress);
    await this.registry.confirmFeed(ASSET, DENOMINATION, feedCAddress);

    this.feedD = await deployMockContract(this.signers.owner, aggregatorArtifact.abi);
    await this.feedD.mock.latestRound.returns(D_STARTING_ROUND); // Mock feed response
    await this.registry.proposeFeed(ASSET, DENOMINATION, this.feedD.address);
    await this.registry.confirmFeed(ASSET, DENOMINATION, this.feedD.address);
    await this.feedD.mock.latestRound.returns(D_LATEST_ROUND);
  });

  it("getRoundRange() should return the round range for a phase", async function () {
    const Phase1RoundRange = await this.registry.getRoundRange(ASSET, DENOMINATION, PHASE_ONE);
    expect(Phase1RoundRange.startingRoundId).to.equal(getRoundId(PHASE_ONE, A_STARTING_ROUND));
    expect(Phase1RoundRange.endingRoundId).to.equal(getRoundId(PHASE_ONE, A_ENDING_ROUND));

    const Phase2RoundRange = await this.registry.getRoundRange(ASSET, DENOMINATION, PHASE_TWO);
    expect(Phase2RoundRange.startingRoundId).to.equal(getRoundId(PHASE_TWO, B_STARTING_ROUND));
    expect(Phase2RoundRange.endingRoundId).to.equal(getRoundId(PHASE_TWO, B_ENDING_ROUND));

    const Phase3RoundRange = await this.registry.getRoundRange(ASSET, DENOMINATION, PHASE_THREE);
    expect(Phase3RoundRange.startingRoundId).to.equal(getRoundId(PHASE_THREE, ZERO));
    expect(Phase3RoundRange.endingRoundId).to.equal(getRoundId(PHASE_THREE, ZERO));
  });

  it("getPreviousRoundId() should return previous round id", async function () {
    const round1 = getRoundId(PHASE_ONE, A_STARTING_ROUND);
    const round10 = getRoundId(PHASE_ONE, A_ENDING_ROUND);
    const round123 = getRoundId(PHASE_TWO, B_STARTING_ROUND);

    // Case where previous round is within a single phase's round range
    expect(await this.registry.getPreviousRoundId(ASSET, DENOMINATION, round10)).to.equal(round10.sub(1));

    // Case where previous round is in the previous phase
    expect(await this.registry.getPreviousRoundId(ASSET, DENOMINATION, round123)).to.equal(round10);

    // Case where there is no previous round
    expect(await this.registry.getPreviousRoundId(ASSET, DENOMINATION, round1)).to.equal(ZERO);
  });

  it("getPreviousRoundId() should work even with zero phases in between", async function () {});

  it("getNextRoundId() should return next round id", async function () {
    const round10 = getRoundId(PHASE_ONE, A_ENDING_ROUND);
    const round123 = getRoundId(PHASE_TWO, B_STARTING_ROUND);

    // Case where next round is within a single phase's round range
    expect(await this.registry.getNextRoundId(ASSET, DENOMINATION, round10.sub(1))).to.equal(round10);

    // Case where next round is in the next phase
    expect(await this.registry.getNextRoundId(ASSET, DENOMINATION, round10)).to.equal(round123);
  });

  it("getNextRoundId() should work for rounds in the current phase", async function () {
    // Case where round id is beyond the current feed's latest round
    const latestRound = getRoundId(PHASE_FOUR, D_LATEST_ROUND);
    expect(await this.registry.getNextRoundId(ASSET, DENOMINATION, latestRound.sub(1))).to.equal(latestRound);

    // Case where there is no next round
    expect(await this.registry.getNextRoundId(ASSET, DENOMINATION, latestRound)).to.equal(ZERO);

    // getNextRoundId() should work with zero phases in between
    const phase2Round156 = getRoundId(PHASE_TWO, B_ENDING_ROUND);
    const phase4Round40 = getRoundId(PHASE_FOUR, D_STARTING_ROUND);
    expect(await this.registry.getNextRoundId(ASSET, DENOMINATION, phase2Round156)).to.equal(phase4Round40);
  });
});
