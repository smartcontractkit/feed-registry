import hre from "hardhat";
import { Artifact } from "hardhat/types";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/dist/src/signer-with-address";
import { FeedProxy } from "../typechain/FeedProxy";
import { Signers } from "../types";
import { expect } from "chai";
import { ethers, utils } from "ethers";
import { deployMockContract } from "ethereum-waffle";
import { PairReadAccessController } from "../typechain/PairReadAccessController";

const { deployContract } = hre.waffle;
const ASSET_ADDRESS = "0x0000000000000000000000000000000000000001";
const DENOMINATION = 1;
const PAIR_DATA = ethers.utils.defaultAbiCoder.encode(["address", "uint256"], [ASSET_ADDRESS, DENOMINATION]);
const UNALLOWED_READER = "0x0000000000000000000000000000000000000002";
const TEST_ANSWER = utils.parseEther("999999");

describe("AccessControlledProxyFacade", function () {
  beforeEach(async function () {
    this.signers = {} as Signers;
    const signers: SignerWithAddress[] = await hre.ethers.getSigners();
    this.signers.owner = signers[0];
    this.signers.other = signers[1];

    const feedProxyArtifact: Artifact = await hre.artifacts.readArtifact("FeedProxy");
    this.feedProxy = <FeedProxy>await deployContract(this.signers.owner, feedProxyArtifact, []);

    const aggregatorArtifact: Artifact = await hre.artifacts.readArtifact("AggregatorV2V3Interface");
    this.feed = await deployMockContract(this.signers.owner, aggregatorArtifact.abi);
    await this.feed.mock.latestAnswer.returns(TEST_ANSWER);
    await this.feedProxy.proposeFeed(ASSET_ADDRESS, DENOMINATION, this.feed.address);
    await this.feedProxy.confirmFeed(ASSET_ADDRESS, DENOMINATION, this.feed.address);

    const proxyArtifact: Artifact = await hre.artifacts.readArtifact("AggregatorProxy");
    this.proxy = await deployContract(this.signers.owner, proxyArtifact, [ethers.constants.AddressZero]);

    const proxyFacadeArtifact: Artifact = await hre.artifacts.readArtifact("AccessControlledProxyFacade");
    this.proxyFacade = await deployContract(this.signers.owner, proxyFacadeArtifact, [
      this.proxy.address,
      this.feedProxy.address,
      ASSET_ADDRESS,
      DENOMINATION,
    ]);
    await this.proxy.proposeAggregator(this.proxyFacade.address);
    await this.proxy.confirmAggregator(this.proxyFacade.address);

    const accessControllerArtifact: Artifact = await hre.artifacts.readArtifact("PairReadAccessController");
    this.accessController = <PairReadAccessController>(
      await deployContract(this.signers.owner, accessControllerArtifact)
    );
    await this.feedProxy.setController(this.accessController.address);
    await this.accessController.addLocalAccess(this.proxyFacade.address, PAIR_DATA);
  });

  it("proxyFacade should be initialized correctly", async function () {
    expect(await this.proxyFacade.getFeedProxy()).to.equal(this.feedProxy.address);
    expect(await this.proxyFacade.getAllowedReader()).to.equal(this.proxy.address);
    expect(await this.proxyFacade.getAsset()).to.equal(ASSET_ADDRESS);
    expect(await this.proxyFacade.getDenomination()).to.equal(DENOMINATION);
  });

  it("proxy should be able to read answer through facade", async function () {
    await this.accessController.addLocalAccess(this.proxy.address, PAIR_DATA); // Grant proxy access to read from proxyFacade
    expect(await this.proxy.aggregator()).to.equal(this.proxyFacade.address);
    expect(await this.proxy.latestAnswer()).to.equal(TEST_ANSWER);
    // TODO: other getters
  });

  it("proxy should be able to read answer from registry if is allowed reader", async function () {
    expect(await this.proxyFacade.getAllowedReader()).to.equal(this.proxy.address);
    expect(await this.proxy.latestAnswer()).to.equal(TEST_ANSWER);
  });

  it("should NOT be able to read answer from registry if not allowed reader", async function () {
    expect(await this.proxyFacade.getAllowedReader()).to.not.equal(UNALLOWED_READER);
    await expect(this.proxyFacade.connect(UNALLOWED_READER).latestAnswer()).to.be.revertedWith("No access");
  });
});
