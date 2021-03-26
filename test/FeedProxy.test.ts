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
const USD = utils.keccak256(utils.toUtf8Bytes("USD"));
const TEST_ANSWER = utils.parseEther("999999");
const TEST_DESCRIPTION = 'TKN / USD'
const TEST_DECIMALS = 18
const TEST_VERSION = 4
const TEST_TIMESTAMP = BigNumber.from("123456789");
const TEST_ROUND = BigNumber.from("1");
const TEST_ROUND_DATA = [TEST_ROUND, TEST_ANSWER, TEST_TIMESTAMP, TEST_TIMESTAMP, TEST_ROUND];

describe("FeedProxy", function () {
  beforeEach(async function () {
    this.signers = {} as Signers;
    const signers: SignerWithAddress[] = await hre.ethers.getSigners();
    this.signers.owner = signers[0];
    this.signers.stranger = signers[1];

    const proxyArtifact: Artifact = await hre.artifacts.readArtifact("FeedProxy");
    this.proxy = <FeedProxy>await deployContract(this.signers.owner, proxyArtifact, []);

    const aggregatorArtifact: Artifact = await hre.artifacts.readArtifact("AggregatorV2V3Interface");
    this.feed = await deployMockContract(this.signers.owner, aggregatorArtifact.abi);

    const accessControllerArtifact: Artifact = await hre.artifacts.readArtifact("AccessControllerInterface");
    this.accessController = await deployMockContract(this.signers.owner, accessControllerArtifact.abi);
  });

  it("setController should set access controller for a feed", async function () {
    await this.proxy.setController(this.accessController.address);

    const accessController = await this.proxy.accessController();
    expect(accessController).to.equal(this.accessController.address);
  });

  it("setController should revert for a non-owners", async function () {
    await expect(
      this.proxy.connect(this.signers.stranger).setController(this.accessController.address),
    ).to.be.revertedWith("Only callable by owner");
  });

  it("access controls should work for getter", async function () {
    await this.proxy.addFeeds([ASSET_ADDRESS], [USD], [this.feed.address]);
    await this.feed.mock.latestAnswer.returns(TEST_ANSWER); // Mock feed response

    // Access control is disabled when no controller is set
    expect(await this.proxy.connect(this.signers.stranger).latestAnswer(ASSET_ADDRESS, USD)).to.equal(TEST_ANSWER);

    // Should revert because access is set to false
    await this.proxy.setController(this.accessController.address);
    const msgData = this.proxy.interface.encodeFunctionData("latestAnswer", [ASSET_ADDRESS, USD]);
    const callData = ethers.utils.defaultAbiCoder.encode(
      ["address", "bytes32", "bytes"],
      [ASSET_ADDRESS, USD, msgData],
    ); // TODO: extract to a test util
    await this.accessController.mock.hasAccess.withArgs(this.signers.stranger.address, callData).returns(false); // Mock controller access
    await this.feed.mock.latestAnswer.returns(TEST_ANSWER); // Mock feed response
    await expect(this.proxy.connect(this.signers.stranger).latestAnswer(ASSET_ADDRESS, USD)).to.be.revertedWith(
      "No access",
    );

    // Should pass because access is set to true
    await this.accessController.mock.hasAccess.withArgs(this.signers.stranger.address, callData).returns(true); // Mock controller access
    expect(await this.proxy.connect(this.signers.stranger).latestAnswer(ASSET_ADDRESS, USD)).to.equal(TEST_ANSWER);
  });

  it("decimals returns the latest answer of a feed", async function () {
    await this.proxy.addFeeds([ASSET_ADDRESS], [USD], [this.feed.address]);
    await this.feed.mock.decimals.returns(TEST_DECIMALS); // Mock feed response

    const price = await this.proxy.decimals(ASSET_ADDRESS, USD);
    expect(price).to.equal(TEST_DECIMALS);
  });

  it("decimals should revert for a non-existent feed", async function () {
    await expect(this.proxy.decimals(ASSET_ADDRESS, USD)).to.be.revertedWith(
      "function call to a non-contract account",
    );
  });

  it("description returns the latest answer of a feed", async function () {
    await this.proxy.addFeeds([ASSET_ADDRESS], [USD], [this.feed.address]);
    await this.feed.mock.description.returns(TEST_DESCRIPTION); // Mock feed response

    const price = await this.proxy.description(ASSET_ADDRESS, USD);
    expect(price).to.equal(TEST_DESCRIPTION);
  });

  it("description should revert for a non-existent feed", async function () {
    await expect(this.proxy.description(ASSET_ADDRESS, USD)).to.be.revertedWith(
      "function call to a non-contract account",
    );
  });

  it("decimals returns the latest answer of a feed", async function () {
    await this.proxy.addFeeds([ASSET_ADDRESS], [USD], [this.feed.address]);
    await this.feed.mock.decimals.returns(TEST_DECIMALS); // Mock feed response

    const price = await this.proxy.decimals(ASSET_ADDRESS, USD);
    expect(price).to.equal(TEST_DECIMALS);
  });

  it("decimals should revert for a non-existent feed", async function () {
    await expect(this.proxy.decimals(ASSET_ADDRESS, USD)).to.be.revertedWith(
      "function call to a non-contract account",
    );
  });

  it("latestAnswer returns the latest answer of a feed", async function () {
    await this.proxy.addFeeds([ASSET_ADDRESS], [USD], [this.feed.address]);
    await this.feed.mock.latestAnswer.returns(TEST_ANSWER); // Mock feed response

    const price = await this.proxy.latestAnswer(ASSET_ADDRESS, USD);
    expect(price).to.equal(TEST_ANSWER);
  });

  it("latestAnswer should revert for a non-existent feed", async function () {
    await expect(this.proxy.latestAnswer(ASSET_ADDRESS, USD)).to.be.revertedWith(
      "function call to a non-contract account",
    );
  });

  it("latestTimestamp returns the latest answer of a feed", async function () {
    await this.proxy.addFeeds([ASSET_ADDRESS], [USD], [this.feed.address]);
    await this.feed.mock.latestTimestamp.returns(TEST_TIMESTAMP); // Mock feed response

    const latestTimestamp = await this.proxy.latestTimestamp(ASSET_ADDRESS, USD);
    expect(latestTimestamp).to.equal(TEST_TIMESTAMP);
  });

  it("latestTimestamp should revert for a non-existent feed", async function () {
    await expect(this.proxy.latestTimestamp(ASSET_ADDRESS, USD)).to.be.revertedWith(
      "function call to a non-contract account",
    );
  });

  it("latestRound returns the latest answer of a feed", async function () {
    await this.proxy.addFeeds([ASSET_ADDRESS], [USD], [this.feed.address]);
    await this.feed.mock.latestRound.returns(TEST_ROUND); // Mock feed response

    const latestRound = await this.proxy.latestRound(ASSET_ADDRESS, USD);
    expect(latestRound).to.equal(TEST_ROUND);
  });

  it("latestRound should revert for a non-existent feed", async function () {
    await expect(this.proxy.latestRound(ASSET_ADDRESS, USD)).to.be.revertedWith(
      "function call to a non-contract account",
    );
  });

  it("getAnswer returns the answer of a round", async function () {
    await this.proxy.addFeeds([ASSET_ADDRESS], [USD], [this.feed.address]);
    await this.feed.mock.getAnswer.withArgs(TEST_ROUND).returns(TEST_ANSWER); // Mock feed response

    const answer = await this.proxy.getAnswer(ASSET_ADDRESS, USD, TEST_ROUND);
    expect(answer).to.equal(TEST_ANSWER);
  });

  it("getAnswer should revert for a non-existent feed", async function () {
    await expect(this.proxy.getAnswer(ASSET_ADDRESS, USD, TEST_ROUND)).to.be.revertedWith(
      "function call to a non-contract account",
    );
  });

  it("getTimestamp returns the timestamp of a round", async function () {
    await this.proxy.addFeeds([ASSET_ADDRESS], [USD], [this.feed.address]);
    await this.feed.mock.getTimestamp.withArgs(TEST_ROUND).returns(TEST_TIMESTAMP); // Mock feed response

    const timestamp = await this.proxy.getTimestamp(ASSET_ADDRESS, USD, TEST_ROUND);
    expect(timestamp).to.equal(TEST_TIMESTAMP);
  });

  it("getTimestamp should revert for a non-existent feed", async function () {
    await expect(this.proxy.getTimestamp(ASSET_ADDRESS, USD, TEST_ROUND)).to.be.revertedWith(
      "function call to a non-contract account",
    );
  });

  it("latestRoundData returns the latest round data of a feed", async function () {
    await this.proxy.addFeeds([ASSET_ADDRESS], [USD], [this.feed.address]);
    await this.feed.mock.latestRoundData.returns(...TEST_ROUND_DATA); // Mock feed response

    const roundData = await this.proxy.latestRoundData(ASSET_ADDRESS, USD);
    expect(roundData).to.eql(TEST_ROUND_DATA);
  });

  it("latestRoundData should revert for a non-existent feed", async function () {
    await expect(this.proxy.latestRoundData(ASSET_ADDRESS, USD)).to.be.revertedWith(
      "function call to a non-contract account",
    );
  });

  it("getRoundData returns the latest round data of a feed", async function () {
    await this.proxy.addFeeds([ASSET_ADDRESS], [USD], [this.feed.address]);
    await this.feed.mock.getRoundData.withArgs(TEST_ROUND).returns(...TEST_ROUND_DATA); // Mock feed response

    const roundData = await this.proxy.getRoundData(ASSET_ADDRESS, USD, TEST_ROUND);
    expect(roundData).to.eql(TEST_ROUND_DATA);
  });

  it("getRoundData should revert for a non-existent feed", async function () {
    await expect(this.proxy.getRoundData(ASSET_ADDRESS, USD, TEST_ROUND)).to.be.revertedWith(
      "function call to a non-contract account",
    );
  });
});
