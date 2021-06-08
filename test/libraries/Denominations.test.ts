import hre from "hardhat";
import { Artifact } from "hardhat/types";
import { expect } from "chai";
import { MockDenominator } from "../../typechain/MockDenominator";
import { contract } from "../utils/context";
import { ethers } from "ethers";

const { deployContract } = hre.waffle;

const ETH = "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE";
const USD = address(840);
const GBP = address(826);
const AUD = address(36);

function address(id: number) {
  return ethers.utils.hexZeroPad(ethers.utils.hexlify(id), 20);
}

contract("Denominations", function () {
  beforeEach(async function () {
    const mockDenominatorArtifact: Artifact = await hre.artifacts.readArtifact("MockDenominator");
    this.denominations = <MockDenominator>await deployContract(this.signers.owner, mockDenominatorArtifact, []);
  });

  it("returns denominations", async function () {
    expect(await this.denominations.getETH()).to.equal(ETH);
    expect(await this.denominations.getUSD()).to.equal(USD);
    expect(await this.denominations.getGBP()).to.equal(GBP);
    expect(await this.denominations.getAUD()).to.equal(AUD);
  });
});
