import hre from "hardhat";
import { Artifact } from "hardhat/types";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/dist/src/signer-with-address";
import { FeedRegistry } from "../typechain/FeedRegistry";
import { Signers } from "../types";
import { expect } from "chai";
import { deployMockContract } from "ethereum-waffle";
import { TEST_ANSWER, ASSET_ADDRESS, DENOMINATION } from "./utils/constants";

const { deployContract } = hre.waffle;

describe("ProxyFacade", function () {
  beforeEach(async function () {
    this.signers = {} as Signers;
    const signers: SignerWithAddress[] = await hre.ethers.getSigners();
    this.signers.owner = signers[0];
    this.signers.other = signers[1];

    const FeedRegistryArtifact: Artifact = await hre.artifacts.readArtifact("FeedRegistry");
    this.FeedRegistry = <FeedRegistry>await deployContract(this.signers.owner, FeedRegistryArtifact, []);

    const aggregatorArtifact: Artifact = await hre.artifacts.readArtifact("AggregatorV2V3Interface");
    this.feed = await deployMockContract(this.signers.owner, aggregatorArtifact.abi);
    await this.feed.mock.latestAnswer.returns(TEST_ANSWER);
    await this.FeedRegistry.proposeFeed(ASSET_ADDRESS, DENOMINATION, this.feed.address);
    await this.FeedRegistry.confirmFeed(ASSET_ADDRESS, DENOMINATION, this.feed.address);

    const proxyFacadeArtifact: Artifact = await hre.artifacts.readArtifact("ProxyFacade");
    this.proxyFacade = await deployContract(this.signers.owner, proxyFacadeArtifact, [
      this.FeedRegistry.address,
      ASSET_ADDRESS,
      DENOMINATION,
    ]);
    this.owned = this.proxyFacade;

    const proxyArtifact: Artifact = await hre.artifacts.readArtifact("AggregatorProxy");
    this.proxy = await deployContract(this.signers.owner, proxyArtifact, [this.proxyFacade.address]);
  });

  it("proxyFacade should be initialized correctly", async function () {
    expect(await this.proxyFacade.getFeedRegistry()).to.equal(this.FeedRegistry.address);
    expect(await this.proxyFacade.getAsset()).to.equal(ASSET_ADDRESS);
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
