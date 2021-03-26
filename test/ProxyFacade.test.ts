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

describe("ProxyFacade", function () {
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

    const proxyFacadeArtifact: Artifact = await hre.artifacts.readArtifact("ProxyFacade");
    this.proxyFacade = await deployContract(this.signers.owner, proxyFacadeArtifact, [
      this.feedProxy.address,
      ASSET_ADDRESS,
      DENOMINATION,
    ]);

    const proxyArtifact: Artifact = await hre.artifacts.readArtifact("AggregatorProxy");
    this.proxy = await deployContract(this.signers.owner, proxyArtifact, [this.proxyFacade.address]);

    // TODO: vendor v0.6/SimpleWriteAccessController for testing purposes
    const accessControllerArtifact: Artifact = await hre.artifacts.readArtifact("AccessControllerInterface");
    this.accessController = await deployMockContract(this.signers.owner, accessControllerArtifact.abi);
  });

  it("proxyFacade should be able to read answer from registry", async function () {
    expect(await this.proxyFacade.getFeedProxy()).to.equal(this.feedProxy.address);
    expect(await this.proxyFacade.getAsset()).to.equal(ASSET_ADDRESS);
    expect(await this.proxyFacade.getDenomination()).to.equal(DENOMINATION);

    expect(await this.proxyFacade.latestAnswer()).to.equal(TEST_ANSWER);
    // TODO: other getters
  });

  it("proxy should be able to read answer through facade", async function () {
    expect(await this.proxy.aggregator()).to.equal(this.proxyFacade.address);

    expect(await this.proxy.latestAnswer()).to.equal(TEST_ANSWER);
    // TODO: other getters
  });

  describe("ProxyFacade Access controls", function () {
    beforeEach(async function () {
        await this.feedProxy.setController(this.accessController.address); // set access controller    
    })

    it("proxyFacade should NOT be able to read answer from registry if not granted access", async function () {
        await this.accessController.mock.hasAccess.returns(false); // Mock controller access
    
        await expect(this.proxyFacade.latestAnswer()).to.be.revertedWith(
            "No access",
        );
    });

    it("proxyFacade should be able to read answer from registry if not granted access", async function () {
        await this.accessController.mock.hasAccess.returns(true); // Mock controller access

        expect(await this.proxyFacade.latestAnswer()).to.equal(TEST_ANSWER);
    });

    it("proxy should NOT be able to read answer from registry if not granted access", async function () {
        await this.accessController.mock.hasAccess.returns(false); // Mock controller access
    
        await expect(this.proxy.latestAnswer()).to.be.revertedWith(
            "No access",
        );
    });

    it("proxy should be able to read answer from registry if not granted access", async function () {
        await this.accessController.mock.hasAccess.returns(true); // Mock controller access

        expect(await this.proxy.latestAnswer()).to.equal(TEST_ANSWER);
    });
  })
});
