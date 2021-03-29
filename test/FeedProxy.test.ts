import hre from "hardhat";
import { Artifact } from "hardhat/types";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/dist/src/signer-with-address";
import { FeedProxy } from "../typechain/FeedProxy";
import { Signers } from "../types";
import { expect } from "chai";
import { BigNumber, utils } from "ethers";
import { deployMockContract } from "ethereum-waffle";

const { deployContract } = hre.waffle;
const ASSET_ADDRESS = "0x0000000000000000000000000000000000000001";
const DENOMINATION = utils.keccak256(utils.toUtf8Bytes("USD"));
const TEST_ANSWER = utils.parseEther("999999");
const TEST_DESCRIPTION = "TKN / USD";
const TEST_DECIMALS = 18;
const TEST_VERSION = 4;
const TEST_TIMESTAMP = BigNumber.from("123456789");
const TEST_ROUND = BigNumber.from("1");
const TEST_ROUND_DATA = [TEST_ROUND, TEST_ANSWER, TEST_TIMESTAMP, TEST_TIMESTAMP, TEST_ROUND];

describe("FeedProxy", function () {
  beforeEach(async function () {
    this.signers = {} as Signers;
    const signers: SignerWithAddress[] = await hre.ethers.getSigners();
    this.signers.owner = signers[0];
    this.signers.other = signers[1];

    const feedProxyArtifact: Artifact = await hre.artifacts.readArtifact("FeedProxy");
    this.feedProxy = <FeedProxy>await deployContract(this.signers.owner, feedProxyArtifact, []);

    const aggregatorArtifact: Artifact = await hre.artifacts.readArtifact("AggregatorV2V3Interface");
    this.feed = await deployMockContract(this.signers.owner, aggregatorArtifact.abi);
  });

  it("decimals returns the latest answer of a feed", async function () {
    await this.feedProxy.addFeeds([ASSET_ADDRESS], [DENOMINATION], [this.feed.address]);
    await this.feed.mock.decimals.returns(TEST_DECIMALS); // Mock feed response

    const decimals = await this.feedProxy.decimals(ASSET_ADDRESS, DENOMINATION);
    expect(decimals).to.equal(TEST_DECIMALS);
  });

  it("decimals should revert for a non-existent feed", async function () {
    await expect(this.feedProxy.decimals(ASSET_ADDRESS, DENOMINATION)).to.be.revertedWith(
      "function call to a non-contract account",
    );
  });

  it("description returns the latest answer of a feed", async function () {
    await this.feedProxy.addFeeds([ASSET_ADDRESS], [DENOMINATION], [this.feed.address]);
    await this.feed.mock.description.returns(TEST_DESCRIPTION); // Mock feed response

    const description = await this.feedProxy.description(ASSET_ADDRESS, DENOMINATION);
    expect(description).to.equal(TEST_DESCRIPTION);
  });

  it("description should revert for a non-existent feed", async function () {
    await expect(this.feedProxy.description(ASSET_ADDRESS, DENOMINATION)).to.be.revertedWith(
      "function call to a non-contract account",
    );
  });

  it("version returns the latest answer of a feed", async function () {
    await this.feedProxy.addFeeds([ASSET_ADDRESS], [DENOMINATION], [this.feed.address]);
    await this.feed.mock.version.returns(TEST_VERSION); // Mock feed response

    const version = await this.feedProxy.version(ASSET_ADDRESS, DENOMINATION);
    expect(version).to.equal(TEST_VERSION);
  });

  it("version should revert for a non-existent feed", async function () {
    await expect(this.feedProxy.version(ASSET_ADDRESS, DENOMINATION)).to.be.revertedWith(
      "function call to a non-contract account",
    );
  });

  it("latestAnswer returns the latest answer of a feed", async function () {
    await this.feedProxy.addFeeds([ASSET_ADDRESS], [DENOMINATION], [this.feed.address]);
    await this.feed.mock.latestAnswer.returns(TEST_ANSWER); // Mock feed response

    const answer = await this.feedProxy.latestAnswer(ASSET_ADDRESS, DENOMINATION);
    expect(answer).to.equal(TEST_ANSWER);
  });

  it("latestAnswer should revert for a non-existent feed", async function () {
    await expect(this.feedProxy.latestAnswer(ASSET_ADDRESS, DENOMINATION)).to.be.revertedWith(
      "function call to a non-contract account",
    );
  });

  it("latestTimestamp returns the latest answer of a feed", async function () {
    await this.feedProxy.addFeeds([ASSET_ADDRESS], [DENOMINATION], [this.feed.address]);
    await this.feed.mock.latestTimestamp.returns(TEST_TIMESTAMP); // Mock feed response

    const latestTimestamp = await this.feedProxy.latestTimestamp(ASSET_ADDRESS, DENOMINATION);
    expect(latestTimestamp).to.equal(TEST_TIMESTAMP);
  });

  it("latestTimestamp should revert for a non-existent feed", async function () {
    await expect(this.feedProxy.latestTimestamp(ASSET_ADDRESS, DENOMINATION)).to.be.revertedWith(
      "function call to a non-contract account",
    );
  });

  it("latestRound returns the latest answer of a feed", async function () {
    await this.feedProxy.addFeeds([ASSET_ADDRESS], [DENOMINATION], [this.feed.address]);
    await this.feed.mock.latestRound.returns(TEST_ROUND); // Mock feed response

    const latestRound = await this.feedProxy.latestRound(ASSET_ADDRESS, DENOMINATION);
    expect(latestRound).to.equal(TEST_ROUND);
  });

  it("latestRound should revert for a non-existent feed", async function () {
    await expect(this.feedProxy.latestRound(ASSET_ADDRESS, DENOMINATION)).to.be.revertedWith(
      "function call to a non-contract account",
    );
  });

  it("getAnswer returns the answer of a round", async function () {
    await this.feedProxy.addFeeds([ASSET_ADDRESS], [DENOMINATION], [this.feed.address]);
    await this.feed.mock.getAnswer.withArgs(TEST_ROUND).returns(TEST_ANSWER); // Mock feed response

    const answer = await this.feedProxy.getAnswer(ASSET_ADDRESS, DENOMINATION, TEST_ROUND);
    expect(answer).to.equal(TEST_ANSWER);
  });

  it("getAnswer should revert for a non-existent feed", async function () {
    await expect(this.feedProxy.getAnswer(ASSET_ADDRESS, DENOMINATION, TEST_ROUND)).to.be.revertedWith(
      "function call to a non-contract account",
    );
  });

  it("getTimestamp returns the timestamp of a round", async function () {
    await this.feedProxy.addFeeds([ASSET_ADDRESS], [DENOMINATION], [this.feed.address]);
    await this.feed.mock.getTimestamp.withArgs(TEST_ROUND).returns(TEST_TIMESTAMP); // Mock feed response

    const timestamp = await this.feedProxy.getTimestamp(ASSET_ADDRESS, DENOMINATION, TEST_ROUND);
    expect(timestamp).to.equal(TEST_TIMESTAMP);
  });

  it("getTimestamp should revert for a non-existent feed", async function () {
    await expect(this.feedProxy.getTimestamp(ASSET_ADDRESS, DENOMINATION, TEST_ROUND)).to.be.revertedWith(
      "function call to a non-contract account",
    );
  });

  it("latestRoundData returns the latest round data of a feed", async function () {
    await this.feedProxy.addFeeds([ASSET_ADDRESS], [DENOMINATION], [this.feed.address]);
    await this.feed.mock.latestRoundData.returns(...TEST_ROUND_DATA); // Mock feed response

    const roundData = await this.feedProxy.latestRoundData(ASSET_ADDRESS, DENOMINATION);
    expect(roundData).to.eql(TEST_ROUND_DATA);
  });

  it("latestRoundData should revert for a non-existent feed", async function () {
    await expect(this.feedProxy.latestRoundData(ASSET_ADDRESS, DENOMINATION)).to.be.revertedWith(
      "function call to a non-contract account",
    );
  });

  it("getRoundData returns the latest round data of a feed", async function () {
    await this.feedProxy.addFeeds([ASSET_ADDRESS], [DENOMINATION], [this.feed.address]);
    await this.feed.mock.getRoundData.withArgs(TEST_ROUND).returns(...TEST_ROUND_DATA); // Mock feed response

    const roundData = await this.feedProxy.getRoundData(ASSET_ADDRESS, DENOMINATION, TEST_ROUND);
    expect(roundData).to.eql(TEST_ROUND_DATA);
  });

  it("getRoundData should revert for a non-existent feed", async function () {
    await expect(this.feedProxy.getRoundData(ASSET_ADDRESS, DENOMINATION, TEST_ROUND)).to.be.revertedWith(
      "function call to a non-contract account",
    );
  });
});
