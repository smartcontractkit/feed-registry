import hre from "hardhat";
import { Artifact } from "hardhat/types";
import { expect } from "chai";
import { MockDenominator } from "../../typechain/MockDenominator";
import { contract } from "../utils/context";
import { ethers } from "ethers";

const { deployContract } = hre.waffle;

const ETH = "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE";
const BTC = "0xbBbBBBBbbBBBbbbBbbBbbbbBBbBbbbbBbBbbBBbB";
const USD = address(840);
const GBP = address(826);
const AUD = address(36);
const EUR = address(978);
const JPY = address(392);
const KRW = address(410);
const CNY = address(156);
const CAD = address(124);
const CHF = address(756);
const ARS = address(32);
const PHP = address(608);
const NZD = address(554);
const SGD = address(702);

function address(id: number) {
  return ethers.utils.hexZeroPad(ethers.utils.hexlify(id), 20);
}

contract("Denominations", function () {
  beforeEach(async function () {
    const mockDenominatorArtifact: Artifact = await hre.artifacts.readArtifact("MockDenominator");
    this.denominations = <MockDenominator>await deployContract(this.signers.owner, mockDenominatorArtifact, []);
  });

  it("fiat denominations are in hexadecimal", async function () {
    expect(USD).to.equal("0x0000000000000000000000000000000000000348");
    expect(GBP).to.equal("0x000000000000000000000000000000000000033a");
    expect(AUD).to.equal("0x0000000000000000000000000000000000000024");
    expect(EUR).to.equal("0x00000000000000000000000000000000000003d2");
    expect(JPY).to.equal("0x0000000000000000000000000000000000000188");
    expect(KRW).to.equal("0x000000000000000000000000000000000000019a");
    expect(CNY).to.equal("0x000000000000000000000000000000000000009c");
    expect(CAD).to.equal("0x000000000000000000000000000000000000007c");
    expect(CHF).to.equal("0x00000000000000000000000000000000000002f4");
    expect(ARS).to.equal("0x0000000000000000000000000000000000000020");
    expect(PHP).to.equal("0x0000000000000000000000000000000000000260");
    expect(NZD).to.equal("0x000000000000000000000000000000000000022a");
    expect(SGD).to.equal("0x00000000000000000000000000000000000002be");
  });

  it("returns denominations", async function () {
    expect(await this.denominations.getETH()).to.equal(ETH);
    expect(await this.denominations.getBTC()).to.equal(BTC);
    expect(await this.denominations.getUSD()).to.equal(USD);
    expect(await this.denominations.getGBP()).to.equal(GBP);
    expect(await this.denominations.getEUR()).to.equal(EUR);
    expect(await this.denominations.getAUD()).to.equal(AUD);
  });
});
