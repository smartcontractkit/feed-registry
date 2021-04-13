import hre from "hardhat";
import { Artifact } from "hardhat/types";
import { FeedRegistry } from "../typechain/FeedRegistry";
import { expect } from "chai";
import { TEST_ANSWER, ASSET, DENOMINATION } from "./utils/constants";
import { contract } from "./utils/context";
import { deployMockAggregator } from "./utils/mocks";

const { deployContract } = hre.waffle;

contract("ProxyFacade", function () {
  beforeEach(async function () {
    const FeedRegistryArtifact: Artifact = await hre.artifacts.readArtifact("FeedRegistry");
    this.registry = <FeedRegistry>await deployContract(this.signers.owner, FeedRegistryArtifact, []);

    this.feed = await deployMockAggregator(this.signers.owner);
    await this.registry.proposeFeed(ASSET, DENOMINATION, this.feed.address);
    await this.registry.confirmFeed(ASSET, DENOMINATION, this.feed.address);

    const proxyFacadeArtifact: Artifact = await hre.artifacts.readArtifact("ProxyFacade");
    this.proxyFacade = await deployContract(this.signers.owner, proxyFacadeArtifact, [
      this.registry.address,
      ASSET,
      DENOMINATION,
    ]);
    this.owned = this.proxyFacade;

    const proxyArtifact: Artifact = await hre.artifacts.readArtifact("AggregatorProxy");
    this.proxy = await deployContract(this.signers.owner, proxyArtifact, [this.proxyFacade.address]);
  });

  it("proxyFacade should be initialized correctly", async function () {
    expect(await this.proxyFacade.getFeedRegistry()).to.equal(this.registry.address);
    expect(await this.proxyFacade.getAsset()).to.equal(ASSET);
    expect(await this.proxyFacade.getDenomination()).to.equal(DENOMINATION);
    expect(await this.proxyFacade.latestAnswer()).to.equal(TEST_ANSWER);
    // TODO: other getters
  });

  it("proxyFacade should be able to read answer from registry", async function () {
    expect(await this.proxyFacade.latestAnswer()).to.equal(TEST_ANSWER);
    // TODO: other getters
  });

  it("proxy should be able to read answer through proxyFacade", async function () {
    expect(await this.proxy.aggregator()).to.equal(this.proxyFacade.address);
    expect(await this.proxy.latestAnswer()).to.equal(TEST_ANSWER);
    // TODO: other getters
  });
});
