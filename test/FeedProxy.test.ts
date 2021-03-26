import hre from "hardhat";
import { Artifact } from "hardhat/types";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/dist/src/signer-with-address";
import { FeedProxy } from "../typechain/FeedProxy";
import { Signers } from "../types";
import { expect } from "chai";
import { BigNumber, ethers, utils } from "ethers";
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

    const accessControllerArtifact: Artifact = await hre.artifacts.readArtifact("AccessControllerInterface");
    this.accessController = await deployMockContract(this.signers.owner, accessControllerArtifact.abi);
  });

  it("setController should set access controller for a feed", async function () {
    await this.feedProxy.setController(this.accessController.address);

    const accessController = await this.feedProxy.accessController();
    expect(accessController).to.equal(this.accessController.address);
  });

  it("setController should revert for a non-owners", async function () {
    await expect(
      this.feedProxy.connect(this.signers.other).setController(this.accessController.address),
    ).to.be.revertedWith("Only callable by owner");
  });

  it("access controls should work for getter", async function () {
    await this.feedProxy.addFeeds([ASSET_ADDRESS], [DENOMINATION], [this.feed.address]);
    await this.feed.mock.latestAnswer.returns(TEST_ANSWER); // Mock feed response

    // Access control is disabled when no controller is set
    expect(await this.feedProxy.connect(this.signers.other).latestAnswer(ASSET_ADDRESS, DENOMINATION)).to.equal(
      TEST_ANSWER,
    );

    // Should revert because access is set to false
    await this.feedProxy.setController(this.accessController.address);
    const msgData = this.feedProxy.interface.encodeFunctionData("latestAnswer", [ASSET_ADDRESS, DENOMINATION]);
    const callData = ethers.utils.defaultAbiCoder.encode(
      ["address", "bytes32", "bytes"],
      [ASSET_ADDRESS, DENOMINATION, msgData],
    ); // TODO: extract to a test util
    await this.accessController.mock.hasAccess.withArgs(this.signers.other.address, callData).returns(false); // Mock controller access
    await this.feed.mock.latestAnswer.returns(TEST_ANSWER); // Mock feed response
    await expect(
      this.feedProxy.connect(this.signers.other).latestAnswer(ASSET_ADDRESS, DENOMINATION),
    ).to.be.revertedWith("No access");

    // Should pass because access is set to true
    await this.accessController.mock.hasAccess.withArgs(this.signers.other.address, callData).returns(true); // Mock controller access
    expect(await this.feedProxy.connect(this.signers.other).latestAnswer(ASSET_ADDRESS, DENOMINATION)).to.equal(
      TEST_ANSWER,
    );
  });

  it("decimals returns the latest answer of a feed", async function () {
    await this.feedProxy.addFeeds([ASSET_ADDRESS], [DENOMINATION], [this.feed.address]);
    await this.feed.mock.decimals.returns(TEST_DECIMALS); // Mock feed response

    const price = await this.feedProxy.decimals(ASSET_ADDRESS, DENOMINATION);
    expect(price).to.equal(TEST_DECIMALS);
  });

  it("decimals should revert for a non-existent feed", async function () {
    await expect(this.feedProxy.decimals(ASSET_ADDRESS, DENOMINATION)).to.be.revertedWith(
      "function call to a non-contract account",
    );
  });

  it("description returns the latest answer of a feed", async function () {
    await this.feedProxy.addFeeds([ASSET_ADDRESS], [DENOMINATION], [this.feed.address]);
    await this.feed.mock.description.returns(TEST_DESCRIPTION); // Mock feed response

    const price = await this.feedProxy.description(ASSET_ADDRESS, DENOMINATION);
    expect(price).to.equal(TEST_DESCRIPTION);
  });

  it("description should revert for a non-existent feed", async function () {
    await expect(this.feedProxy.description(ASSET_ADDRESS, DENOMINATION)).to.be.revertedWith(
      "function call to a non-contract account",
    );
  });

  it("version returns the latest answer of a feed", async function () {
    await this.feedProxy.addFeeds([ASSET_ADDRESS], [DENOMINATION], [this.feed.address]);
    await this.feed.mock.version.returns(TEST_VERSION); // Mock feed response

    const price = await this.feedProxy.version(ASSET_ADDRESS, DENOMINATION);
    expect(price).to.equal(TEST_VERSION);
  });

  it("version should revert for a non-existent feed", async function () {
    await expect(this.feedProxy.version(ASSET_ADDRESS, DENOMINATION)).to.be.revertedWith(
      "function call to a non-contract account",
    );
  });

  it("latestAnswer returns the latest answer of a feed", async function () {
    await this.feedProxy.addFeeds([ASSET_ADDRESS], [DENOMINATION], [this.feed.address]);
    await this.feed.mock.latestAnswer.returns(TEST_ANSWER); // Mock feed response

    const price = await this.feedProxy.latestAnswer(ASSET_ADDRESS, DENOMINATION);
    expect(price).to.equal(TEST_ANSWER);
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
