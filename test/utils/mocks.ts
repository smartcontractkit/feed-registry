import hre from "hardhat";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { deployMockContract } from "ethereum-waffle";
import { Artifact } from "hardhat/types";
import { TEST_ANSWER, TEST_ROUND_DATA } from "./constants";

export async function deployMockAggregator(owner: SignerWithAddress) {
  const aggregatorArtifact: Artifact = await hre.artifacts.readArtifact("AggregatorV2V3Interface");
  const feed = await deployMockContract(owner, aggregatorArtifact.abi);
  await feed.mock.latestAnswer.returns(TEST_ANSWER); // Mock feed response
  await feed.mock.latestRoundData.returns(...TEST_ROUND_DATA); // Mock feed response

  return feed;
}
