import hre from "hardhat";
import { Artifact } from "hardhat/types";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/dist/src/signer-with-address";
import { FeedProxy } from "../typechain/FeedProxy";
import { Signers } from "../types";
import { expect } from "chai";
import { ethers, utils } from "ethers";
import { deployMockContract } from "ethereum-waffle";
import { PairReadAccessController } from "../typechain/PairReadAccessController";
import { shouldBehaveLikeOwned } from "./Owned.behaviour";
import { shouldBehaveLikeAccessControlled } from "./AccessControlled.behaviour";

const { deployContract } = hre.waffle;
const ASSET_ADDRESS = "0x0000000000000000000000000000000000000001";
const DENOMINATION = utils.keccak256(utils.toUtf8Bytes("USD"));
const PAIR_DATA = ethers.utils.defaultAbiCoder.encode(["address", "bytes32"], [ASSET_ADDRESS, DENOMINATION]);
const TEST_ADDRESS = "0x0000000000000000000000000000000000000002";
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
    await this.feedProxy.addFeeds([ASSET_ADDRESS], [DENOMINATION], [this.feed.address]);

    const accessControllerArtifact: Artifact = await hre.artifacts.readArtifact("PairReadAccessController");
    this.accessController = <PairReadAccessController>(
      await deployContract(this.signers.owner, accessControllerArtifact)
    );

    const proxyFacadeArtifact: Artifact = await hre.artifacts.readArtifact("AccessControlledProxyFacade");
    this.proxyFacade = await deployContract(this.signers.owner, proxyFacadeArtifact, [
      this.accessController.address,
      this.feedProxy.address,
      ASSET_ADDRESS,
      DENOMINATION,
    ]);
    this.owned = this.proxyFacade;
    this.accessControlled = this.proxyFacade;

    const proxyArtifact: Artifact = await hre.artifacts.readArtifact("AggregatorProxy");
    this.proxy = await deployContract(this.signers.owner, proxyArtifact, [this.proxyFacade.address]);
  });

  it("proxyFacade should be initialized correctly", async function () {
    expect(await this.proxyFacade.getFeedProxy()).to.equal(this.feedProxy.address);
    expect(await this.proxyFacade.getController()).to.equal(this.accessController.address);
    expect(await this.proxyFacade.getAsset()).to.equal(ASSET_ADDRESS);
    expect(await this.proxyFacade.getDenomination()).to.equal(DENOMINATION);
    expect(await this.proxyFacade.latestAnswer()).to.equal(TEST_ANSWER);
    // TODO: other getters
  });

  it("proxyFacade should be able to read answer from registry", async function () {
    expect(await this.proxyFacade.latestAnswer()).to.equal(TEST_ANSWER);
    // TODO: other getters
  });

  it("proxy should be able to read answer through facade", async function () {
    await this.accessController.addAccess(this.proxy.address, PAIR_DATA); // Grant proxy access to read from proxyFacade
    expect(await this.proxy.aggregator()).to.equal(this.proxyFacade.address);
    expect(await this.proxy.latestAnswer()).to.equal(TEST_ANSWER);
    // TODO: other getters
  });

  describe("With access controls enabled", function () {
    beforeEach(async function () {
      await this.feedProxy.setController(this.accessController.address); // Enable access controller on feedProxy
    });

    it("proxyFacade should be able to read answer from registry if granted access", async function () {
      await this.accessController.addAccess(this.proxyFacade.address, PAIR_DATA);
      expect(await this.accessController.hasAccess(this.proxyFacade.address, PAIR_DATA)).to.equal(true);
      expect(await this.proxyFacade.latestAnswer()).to.equal(TEST_ANSWER);
    });

    it("proxyFacade should NOT be able to read answer from registry if not granted access", async function () {
      await this.accessController.removeAccess(this.proxyFacade.address, PAIR_DATA);
      expect(await this.accessController.hasAccess(this.proxyFacade.address, PAIR_DATA)).to.equal(false);
      await expect(this.proxyFacade.latestAnswer()).to.be.revertedWith("No access");
      await expect(this.proxy.latestAnswer()).to.be.revertedWith("No access");
    });

    it("proxy should be able to read answer from registry if granted access", async function () {
      await this.accessController.addAccess(this.proxyFacade.address, PAIR_DATA);
      await this.accessController.addAccess(this.proxy.address, PAIR_DATA); // Grant proxy access to read from proxyFacade
      expect(await this.proxy.latestAnswer()).to.equal(TEST_ANSWER);
    });

    it("proxy should NOT be able to read answer from registry if not granted access", async function () {
      await this.accessController.addAccess(this.proxyFacade.address, PAIR_DATA);
      await this.accessController.removeAccess(this.proxy.address, PAIR_DATA); // Do not grany proxy access
      await expect(this.proxy.latestAnswer()).to.be.revertedWith("No access");
    });
  });

  shouldBehaveLikeOwned();
  shouldBehaveLikeAccessControlled();
});
