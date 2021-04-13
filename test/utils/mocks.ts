import hre from "hardhat";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { deployMockContract, MockContract } from "ethereum-waffle";
import { Artifact } from "hardhat/types";
import { TEST_ANSWER, TEST_ROUND, TEST_ROUND_DATA } from "./constants";
import { BigNumber } from "ethers";

type MockAggregatorValues = {
  latestAnswer: BigNumber;
  latestRound: BigNumber;
  latestRoundData: BigNumber[];
};

export async function deployMockAggregator(
  owner: SignerWithAddress,
  values: MockAggregatorValues = {
    latestAnswer: TEST_ANSWER,
    latestRound: TEST_ROUND,
    latestRoundData: TEST_ROUND_DATA,
  },
): Promise<MockContract> {
  const aggregatorArtifact: Artifact = await hre.artifacts.readArtifact("AggregatorV2V3Interface");
  const feed = await deployMockContract(owner, aggregatorArtifact.abi);
  await feed.mock.latestAnswer.returns(values.latestAnswer); // Mock feed response
  await feed.mock.latestRound.returns(values.latestRound); // Mock feed response
  await feed.mock.latestRoundData.returns(...values.latestRoundData); // Mock feed response

  return feed;
}
