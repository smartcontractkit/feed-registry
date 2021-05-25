import hre from "hardhat";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { deployMockContract, MockContract } from "ethereum-waffle";
import { Artifact } from "hardhat/types";

export async function deployMockAggregator(owner: SignerWithAddress): Promise<MockContract> {
  const aggregatorArtifact: Artifact = await hre.artifacts.readArtifact("AggregatorV2V3Interface");
  const contract = await deployMockContract(owner, aggregatorArtifact.abi);
  return contract;
}
