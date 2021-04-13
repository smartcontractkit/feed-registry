import hre from "hardhat";
import { Artifact } from "hardhat/types";
import { FeedRegistry } from "../typechain/FeedRegistry";
import { expect } from "chai";
import { ethers } from "ethers";
import { PairReadAccessController } from "../typechain/PairReadAccessController";
import { ASSET, DENOMINATION, PAIR_DATA, OTHER_TEST_ADDRESS, TEST_ANSWER } from "./utils/constants";
import { contract } from "./utils/context";
import { deployMockAggregator } from "./utils/mocks";

const { deployContract } = hre.waffle;

contract("AccessControlledProxyFacade", function () {
  beforeEach(async function () {
    const FeedRegistryArtifact: Artifact = await hre.artifacts.readArtifact("FeedRegistry");
    this.registry = <FeedRegistry>await deployContract(this.signers.owner, FeedRegistryArtifact, []);

    this.feed = await deployMockAggregator(this.signers.owner);
    await this.registry.proposeFeed(ASSET, DENOMINATION, this.feed.address);
    await this.registry.confirmFeed(ASSET, DENOMINATION, this.feed.address);

    const proxyArtifact: Artifact = await hre.artifacts.readArtifact("AggregatorProxy");
    this.proxy = await deployContract(this.signers.owner, proxyArtifact, [ethers.constants.AddressZero]);

    const proxyFacadeArtifact: Artifact = await hre.artifacts.readArtifact("AccessControlledProxyFacade");
    this.proxyFacade = await deployContract(this.signers.owner, proxyFacadeArtifact, [
      this.proxy.address,
      this.registry.address,
      ASSET,
      DENOMINATION,
    ]);
    await this.proxy.proposeAggregator(this.proxyFacade.address);
    await this.proxy.confirmAggregator(this.proxyFacade.address);

    const accessControllerArtifact: Artifact = await hre.artifacts.readArtifact("PairReadAccessController");
    this.accessController = <PairReadAccessController>(
      await deployContract(this.signers.owner, accessControllerArtifact)
    );
    await this.registry.setController(this.accessController.address);
    await this.accessController.addLocalAccess(this.proxyFacade.address, PAIR_DATA);
  });

  it("proxyFacade should be initialized correctly", async function () {
    expect(await this.proxyFacade.getFeedRegistry()).to.equal(this.registry.address);
    expect(await this.proxyFacade.getAllowedReader()).to.equal(this.proxy.address);
    expect(await this.proxyFacade.getAsset()).to.equal(ASSET);
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
    expect(await this.proxyFacade.getAllowedReader()).to.not.equal(OTHER_TEST_ADDRESS);
    await expect(this.proxyFacade.connect(OTHER_TEST_ADDRESS).latestAnswer()).to.be.revertedWith("No access");
  });
});
