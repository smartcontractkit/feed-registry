import hre from "hardhat";
import { Artifact } from "hardhat/types";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/dist/src/signer-with-address";
import { FeedProxy } from "../typechain/FeedProxy";
import { Signers } from "../types";
import { expect } from "chai";
import { utils } from "ethers";
import { deployMockContract } from "ethereum-waffle";

const { deployContract } = hre.waffle;
const ASSET_ADDRESS = "0x0000000000000000000000000000000000000001";
const USD = utils.keccak256(utils.toUtf8Bytes("USD"));
const TEST_PRICE = utils.parseEther("999999");

describe("FeedProxy", function () {
  beforeEach(async function () {
    this.signers = {} as Signers;
    const signers: SignerWithAddress[] = await hre.ethers.getSigners();
    this.signers.owner = signers[0];
    this.signers.stranger = signers[1];

    const registryArtifact: Artifact = await hre.artifacts.readArtifact("FeedProxy");
    this.registry = <FeedProxy>await deployContract(this.signers.owner, registryArtifact, []);

    const aggregatorArtifact: Artifact = await hre.artifacts.readArtifact("AggregatorV2V3Interface");
    this.feed = await deployMockContract(this.signers.owner, aggregatorArtifact.abi);
  });

  it("getPrice returns the latest answer of a feed", async function () {
    await this.registry.addFeeds([ASSET_ADDRESS], [USD], [this.feed.address]);
    await this.feed.mock.latestAnswer.returns(TEST_PRICE); // Mock feed response

    const price = await this.registry.getPrice(ASSET_ADDRESS, USD);
    expect(price).to.equal(TEST_PRICE);
  });

  it("getPrice should revert for a non-existent feed", async function () {
    await expect(this.registry.getPrice(ASSET_ADDRESS, USD)).to.be.revertedWith(
      "function call to a non-contract account",
    );
  });
});
