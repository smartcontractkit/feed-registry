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
const USD = utils.keccak256(utils.toUtf8Bytes("USD"));
const TEST_PRICE = utils.parseEther("999999");
const TEST_TIMESTAMP = BigNumber.from("123456789");
const TEST_ROUND = BigNumber.from("1");

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

  it("latestAnswer returns the latest answer of a feed", async function () {
    await this.proxy.addFeeds([ASSET_ADDRESS], [USD], [this.feed.address]);
    await this.feed.mock.latestAnswer.returns(TEST_PRICE); // Mock feed response

    const price = await this.proxy.latestAnswer(ASSET_ADDRESS, USD);
    expect(price).to.equal(TEST_PRICE);
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

  it("setController should set acess controller for a feed", async function () {
    await this.proxy.setController(ASSET_ADDRESS, USD, this.accessController.address);

    const accessController = await this.proxy.accessControllers(ASSET_ADDRESS, USD);
    expect(accessController).to.equal(this.accessController.address);
  });

  it("setController should revert for a non-owners", async function () {
    await expect(
      this.proxy.connect(this.signers.stranger).setController(ASSET_ADDRESS, USD, this.accessController.address),
    ).to.be.revertedWith("Only callable by owner");
  });

  it("access controls should work for getter", async function () {
    await this.proxy.addFeeds([ASSET_ADDRESS], [USD], [this.feed.address]);
    await this.feed.mock.latestAnswer.returns(TEST_PRICE); // Mock feed response

    // Access control is disabled when no controller is set
    expect(await this.proxy.connect(this.signers.stranger).latestAnswer(ASSET_ADDRESS, USD)).to.equal(TEST_PRICE);

    // Should revert because access is set to false
    await this.proxy.setController(ASSET_ADDRESS, USD, this.accessController.address);
    const msgData = this.proxy.interface.encodeFunctionData("latestAnswer", [ASSET_ADDRESS, USD]);
    await this.accessController.mock.hasAccess.withArgs(this.signers.stranger.address, msgData).returns(false); // Mock controller access
    await this.feed.mock.latestAnswer.returns(TEST_PRICE); // Mock feed response
    await expect(this.proxy.connect(this.signers.stranger).latestAnswer(ASSET_ADDRESS, USD)).to.be.revertedWith(
      "No access",
    );

    // Should pass because access is set to true
    await this.accessController.mock.hasAccess.withArgs(this.signers.stranger.address, msgData).returns(true); // Mock controller access
    expect(await this.proxy.connect(this.signers.stranger).latestAnswer(ASSET_ADDRESS, USD)).to.equal(TEST_PRICE);
  });
});
