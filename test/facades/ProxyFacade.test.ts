import hre from "hardhat";
import { Artifact } from "hardhat/types";
import { FeedRegistry } from "../../typechain/FeedRegistry";
import { expect } from "chai";
import {
  TEST_ANSWER,
  ASSET,
  DENOMINATION,
  TEST_ROUND,
  TEST_PROXY_ROUND,
  TEST_TIMESTAMP,
  TEST_ROUND_DATA,
} from "../utils/constants";
import { contract } from "../utils/context";
import { deployMockAggregator } from "../utils/mocks";

const { deployContract } = hre.waffle;

contract("ProxyFacade", function () {
  beforeEach(async function () {
    const FeedRegistryArtifact: Artifact = await hre.artifacts.readArtifact("FeedRegistry");
    this.registry = <FeedRegistry>await deployContract(this.signers.owner, FeedRegistryArtifact, []);

    this.feed = await deployMockAggregator(this.signers.owner);
    await this.feed.mock.latestAnswer.returns(TEST_ANSWER);
    await this.feed.mock.getAnswer.withArgs(TEST_ROUND).returns(TEST_ANSWER); // Mock feed response
    await this.feed.mock.latestTimestamp.returns(TEST_TIMESTAMP);
    await this.feed.mock.latestRound.returns(TEST_ROUND);
    await this.feed.mock.latestRoundData.returns(...TEST_ROUND_DATA);

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
  });

  it("proxyFacade should be able to read from registry", async function () {
    expect(await this.proxyFacade.latestAnswer()).to.equal(TEST_ANSWER);
    expect(await this.proxyFacade.latestTimestamp()).to.equal(TEST_TIMESTAMP);
    expect(await this.proxyFacade.latestRound()).to.equal(TEST_PROXY_ROUND);
    expect(await this.proxyFacade.getAnswer(TEST_PROXY_ROUND)).to.equal(TEST_ANSWER);
    // TODO: other getters
  });

  it("proxy should be able to read through proxyFacade", async function () {
    expect(await this.proxy.aggregator()).to.equal(this.proxyFacade.address);
    expect(await this.proxy.latestAnswer()).to.equal(TEST_ANSWER);
    expect(await this.proxy.latestTimestamp()).to.equal(TEST_TIMESTAMP);
    expect(await this.proxy.latestRound()).to.equal(TEST_PROXY_ROUND);

    // TODO
    // Problem: Our current proxies only forwards the aggregator round id component
    // So if our proxies are pointing to a non-aggregator contract the phaseId is lost
    // https://github.com/smartcontractkit/chainlink/blob/develop/evm-contracts/src/v0.6/AggregatorProxy.sol#L89
    // expect(await this.proxy.getAnswer(TEST_PROXY_ROUND)).to.equal(TEST_ANSWER);
  });
});
