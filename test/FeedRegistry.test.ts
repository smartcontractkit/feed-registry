import hre from "hardhat";
import { Artifact } from "hardhat/types";
import { FeedRegistry } from "../typechain/FeedRegistry";
import { expect } from "chai";
import { ethers } from "ethers";
import { shouldBehaveLikeAccessControlled } from "./access/AccessControlled.behaviour";
import {
  ASSET,
  DENOMINATION,
  TEST_ADDRESS,
  TEST_DECIMALS,
  TEST_DESCRIPTION,
  TEST_VERSION,
  TEST_ANSWER,
  TEST_TIMESTAMP,
  TEST_ROUND,
  TEST_ROUND_DATA,
  PHASE_BASE,
  TEST_PROXY_ROUND,
  TEST_PROXY_ROUND_DATA,
  OTHER_ANSWER,
  OTHER_TIMESTAMP,
} from "./utils/constants";
import { contract } from "./utils/context";
import { deployMockAggregator } from "./utils/mocks";

const { deployContract } = hre.waffle;

contract("FeedRegistry", function () {
  beforeEach(async function () {
    const FeedRegistryArtifact: Artifact = await hre.artifacts.readArtifact("FeedRegistry");
    this.registry = <FeedRegistry>await deployContract(this.signers.owner, FeedRegistryArtifact, []);
    this.accessControlled = this.registry;

    this.feed = await deployMockAggregator(this.signers.owner);
    this.otherFeed = await deployMockAggregator(this.signers.owner);
  });

  // TODO: has a limited public interface

  describe("constructor", async function () {
    it("should initialize correctly", async function () {
      expect(await this.registry.owner()).to.equal(this.signers.owner.address);
      const currentPhase = await this.registry.getCurrentPhase(ASSET, DENOMINATION);
      expect(currentPhase.id).to.equal(0);
      expect(currentPhase.aggregator).to.equal(ethers.constants.AddressZero);
    });
  });

  it("returns typeAndVersion", async function () {
    expect(await this.registry.typeAndVersion()).to.equal("FeedRegistry 1.0.0");
  });

  it("owner can propose a feed", async function () {
    await expect(this.registry.proposeFeed(ASSET, DENOMINATION, this.feed.address))
      .to.emit(this.registry, "FeedProposed")
      .withArgs(ASSET, DENOMINATION, this.feed.address, ethers.constants.AddressZero);
    expect(await this.registry.getProposedFeed(ASSET, DENOMINATION)).to.equal(this.feed.address);
  });

  it("non-owners cannot propose a feed", async function () {
    await expect(
      this.registry.connect(this.signers.other).proposeFeed(ASSET, DENOMINATION, this.feed.address),
    ).to.be.revertedWith("Only callable by owner");
  });

  it("owner can confirm a feed", async function () {
    await this.registry.proposeFeed(ASSET, DENOMINATION, this.feed.address);

    const currentPhase = await this.registry.getCurrentPhase(ASSET, DENOMINATION);
    await expect(this.registry.confirmFeed(ASSET, DENOMINATION, this.feed.address))
      .to.emit(this.registry, "FeedConfirmed")
      .withArgs(ASSET, DENOMINATION, this.feed.address, ethers.constants.AddressZero, currentPhase.id + 1);

    const feed = await this.registry.getFeed(ASSET, DENOMINATION);
    expect(feed).to.equal(this.feed.address);

    const isFeedEnabled = await this.registry.isFeedEnabled(feed);
    expect(isFeedEnabled);

    const newPhase = await this.registry.getCurrentPhase(ASSET, DENOMINATION);
    expect(newPhase.id).to.equal(currentPhase.id + 1);
    expect(newPhase.aggregator).to.equal(this.feed.address);
    expect(newPhase.startingAggregatorRoundId).to.equal(await this.feed.latestRound());
    expect(newPhase.endingAggregatorRoundId).to.equal(0);
  });

  it("non-owners cannot confirm a feed", async function () {
    await expect(
      this.registry.connect(this.signers.other).confirmFeed(ASSET, DENOMINATION, this.feed.address),
    ).to.be.revertedWith("Only callable by owner");
  });

  it("owner cannot confirm a feed without proposing first", async function () {
    await expect(this.registry.confirmFeed(ASSET, DENOMINATION, this.feed.address)).to.be.revertedWith(
      "Invalid proposed aggregator",
    );
  });

  it("owner cannot confirm a different feed than what is proposed", async function () {
    await this.registry.proposeFeed(ASSET, DENOMINATION, this.feed.address);
    await expect(this.registry.confirmFeed(ASSET, DENOMINATION, TEST_ADDRESS)).to.be.revertedWith(
      "Invalid proposed aggregator",
    );
  });

  it("owner can remove a feed", async function () {
    // Add
    await this.registry.proposeFeed(ASSET, DENOMINATION, this.feed.address);
    await this.registry.confirmFeed(ASSET, DENOMINATION, this.feed.address);

    // Remove
    await this.registry.proposeFeed(ASSET, DENOMINATION, ethers.constants.AddressZero);
    await this.registry.confirmFeed(ASSET, DENOMINATION, ethers.constants.AddressZero);

    const feed = await this.registry.getFeed(ASSET, DENOMINATION);
    expect(feed).to.equal(ethers.constants.AddressZero);

    const isFeedEnabled = await this.registry.isFeedEnabled(this.feed.address);
    expect(isFeedEnabled).to.equal(false);
  });

  describe("#decimals", async function () {
    it("decimals returns the decimals of a feed", async function () {
      await this.registry.proposeFeed(ASSET, DENOMINATION, this.feed.address);
      await this.registry.confirmFeed(ASSET, DENOMINATION, this.feed.address);
      await this.feed.mock.decimals.returns(TEST_DECIMALS); // Mock feed response

      const decimals = await this.registry.decimals(ASSET, DENOMINATION);
      expect(decimals).to.equal(TEST_DECIMALS);
    });

    it("decimals should revert for a non-existent feed", async function () {
      await expect(this.registry.decimals(ASSET, DENOMINATION)).to.be.revertedWith(
        "function call to a non-contract account",
      );
    });
  });

  describe("#description", async function () {
    it("description returns the description of a feed", async function () {
      await this.registry.proposeFeed(ASSET, DENOMINATION, this.feed.address);
      await this.registry.confirmFeed(ASSET, DENOMINATION, this.feed.address);
      await this.feed.mock.description.returns(TEST_DESCRIPTION); // Mock feed response

      const description = await this.registry.description(ASSET, DENOMINATION);
      expect(description).to.equal(TEST_DESCRIPTION);
    });

    it("description should revert for a non-existent feed", async function () {
      await expect(this.registry.description(ASSET, DENOMINATION)).to.be.revertedWith(
        "function call to a non-contract account",
      );
    });
  });

  describe("#version", async function () {
    it("version returns the version of a feed", async function () {
      await this.registry.proposeFeed(ASSET, DENOMINATION, this.feed.address);
      await this.registry.confirmFeed(ASSET, DENOMINATION, this.feed.address);
      await this.feed.mock.version.returns(TEST_VERSION); // Mock feed response

      const version = await this.registry.version(ASSET, DENOMINATION);
      expect(version).to.equal(TEST_VERSION);
    });

    it("version should revert for a non-existent feed", async function () {
      await expect(this.registry.version(ASSET, DENOMINATION)).to.be.revertedWith(
        "function call to a non-contract account",
      );
    });
  });

  describe("#latestAnswer", () => {
    it("latestAnswer returns the latest answer of a feed", async function () {
      await this.registry.proposeFeed(ASSET, DENOMINATION, this.feed.address);
      await this.registry.confirmFeed(ASSET, DENOMINATION, this.feed.address);
      await this.feed.mock.latestAnswer.returns(TEST_ANSWER); // Mock feed response

      const answer = await this.registry.latestAnswer(ASSET, DENOMINATION);
      expect(answer).to.equal(TEST_ANSWER);
    });

    it("latestAnswer should use latest aggregator after a phase change", async function () {
      await this.registry.proposeFeed(ASSET, DENOMINATION, this.feed.address);
      await this.registry.confirmFeed(ASSET, DENOMINATION, this.feed.address);
      await this.registry.proposeFeed(ASSET, DENOMINATION, this.otherFeed.address);
      await this.registry.confirmFeed(ASSET, DENOMINATION, this.otherFeed.address);
      await this.otherFeed.mock.latestAnswer.returns(OTHER_ANSWER); // Mock feed response

      const answer = await this.registry.latestAnswer(ASSET, DENOMINATION);
      expect(answer).to.equal(OTHER_ANSWER);
    });

    it("latestAnswer should revert for a non-existent feed", async function () {
      await expect(this.registry.latestAnswer(ASSET, DENOMINATION)).to.be.revertedWith(
        "function call to a non-contract account",
      );
    });
  });

  describe("#latestTimestamp", async function () {
    it("latestTimestamp returns the latest timestamp of a feed", async function () {
      await this.registry.proposeFeed(ASSET, DENOMINATION, this.feed.address);
      await this.registry.confirmFeed(ASSET, DENOMINATION, this.feed.address);
      await this.feed.mock.latestTimestamp.returns(TEST_TIMESTAMP); // Mock feed response

      const latestTimestamp = await this.registry.latestTimestamp(ASSET, DENOMINATION);
      expect(latestTimestamp).to.equal(TEST_TIMESTAMP);
    });

    it("latestTimestamp should use latest aggregator after a phase change", async function () {
      await this.registry.proposeFeed(ASSET, DENOMINATION, this.feed.address);
      await this.registry.confirmFeed(ASSET, DENOMINATION, this.feed.address);
      await this.registry.proposeFeed(ASSET, DENOMINATION, this.otherFeed.address);
      await this.registry.confirmFeed(ASSET, DENOMINATION, this.otherFeed.address);
      await this.otherFeed.mock.latestTimestamp.returns(OTHER_TIMESTAMP); // Mock feed response

      const answer = await this.registry.latestTimestamp(ASSET, DENOMINATION);
      expect(answer).to.equal(OTHER_TIMESTAMP);
    });

    it("latestTimestamp should revert for a non-existent feed", async function () {
      await expect(this.registry.latestTimestamp(ASSET, DENOMINATION)).to.be.revertedWith(
        "function call to a non-contract account",
      );
    });
  });

  describe("#latestRound", async function () {
    it("latestRound returns the latest round of a feed", async function () {
      await this.registry.proposeFeed(ASSET, DENOMINATION, this.feed.address);
      await this.registry.confirmFeed(ASSET, DENOMINATION, this.feed.address);
      await this.feed.mock.latestRound.returns(TEST_ROUND); // Mock feed response

      const latestRound = await this.registry.latestRound(ASSET, DENOMINATION);
      expect(latestRound).to.equal(PHASE_BASE.add(TEST_ROUND));
    });

    it("latestRound should revert for a non-existent feed", async function () {
      await expect(this.registry.latestRound(ASSET, DENOMINATION)).to.be.revertedWith(
        "function call to a non-contract account",
      );
    });
  });

  it("getAnswer returns the answer of a round", async function () {
    await this.registry.proposeFeed(ASSET, DENOMINATION, this.feed.address);
    await this.registry.confirmFeed(ASSET, DENOMINATION, this.feed.address);
    await this.feed.mock.getAnswer.withArgs(TEST_ROUND).returns(TEST_ANSWER); // Mock feed response

    const answer = await this.registry.getAnswer(ASSET, DENOMINATION, PHASE_BASE.add(TEST_ROUND));
    expect(answer).to.equal(TEST_ANSWER);
  });

  // TODO: getAnswer should work after a phase change

  it("getAnswer does not revert when called with a non existent round ID", async function () {
    expect(await this.registry.getAnswer(ASSET, DENOMINATION, TEST_ROUND)).to.equal(0);
  });

  it("getTimestamp returns the timestamp of a round", async function () {
    await this.registry.proposeFeed(ASSET, DENOMINATION, this.feed.address);
    await this.registry.confirmFeed(ASSET, DENOMINATION, this.feed.address);
    await this.feed.mock.getTimestamp.withArgs(TEST_ROUND).returns(TEST_TIMESTAMP); // Mock feed response

    const timestamp = await this.registry.getTimestamp(ASSET, DENOMINATION, PHASE_BASE.add(TEST_ROUND));
    expect(timestamp).to.equal(TEST_TIMESTAMP);
  });

  it("getTimestamp should not revert when called with a non existent ID", async function () {
    expect(await this.registry.getTimestamp(ASSET, DENOMINATION, TEST_ROUND)).to.equal(0);
  });

  it("latestRoundData returns the latest round data of a feed", async function () {
    await this.registry.proposeFeed(ASSET, DENOMINATION, this.feed.address);
    await this.registry.confirmFeed(ASSET, DENOMINATION, this.feed.address);
    await this.feed.mock.latestRoundData.returns(...TEST_ROUND_DATA); // Mock feed response

    const roundData = await this.registry.latestRoundData(ASSET, DENOMINATION);
    expect(roundData).to.eql(TEST_PROXY_ROUND_DATA);
  });

  it("latestRoundData should revert for a non-existent feed", async function () {
    await expect(this.registry.latestRoundData(ASSET, DENOMINATION)).to.be.revertedWith(
      "function call to a non-contract account",
    );
  });

  it("getRoundData returns the latest round data of a feed", async function () {
    await this.registry.proposeFeed(ASSET, DENOMINATION, this.feed.address);
    await this.registry.confirmFeed(ASSET, DENOMINATION, this.feed.address);
    await this.feed.mock.getRoundData.withArgs(TEST_ROUND).returns(...TEST_ROUND_DATA); // Mock feed response

    const roundData = await this.registry.getRoundData(ASSET, DENOMINATION, TEST_PROXY_ROUND);
    expect(roundData).to.eql(TEST_PROXY_ROUND_DATA);
  });

  it("getRoundData should revert for a non-existent feed", async function () {
    await expect(this.registry.getRoundData(ASSET, DENOMINATION, TEST_ROUND)).to.be.revertedWith(
      "function call to a non-contract account",
    );
  });

  // TODO: more test cases from https://github.com/smartcontractkit/chainlink/blob/develop/evm-contracts/test/v0.7/AggregatorProxy.test.ts

  shouldBehaveLikeAccessControlled();
});
