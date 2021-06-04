import hre, { ethers } from "hardhat";
import { expect } from "chai";
import { contract } from "../utils/context";
import { ConfirmedOwner } from "../../typechain";
import { Artifact } from "hardhat/types";

const { deployContract } = hre.waffle;

contract("ConfirmedOwner", function () {
  it("Can deploy with nonzero address as owner", async function () {
    const confirmedOwnerArtifact: Artifact = await hre.artifacts.readArtifact(
      "contracts/vendor/ConfirmedOwner.sol:ConfirmedOwner",
    );
    this.owned = <ConfirmedOwner>(
      await deployContract(this.signers.owner, confirmedOwnerArtifact, [this.signers.other.address])
    );
    expect(await this.owned.owner()).to.equal(this.signers.other.address);
  });

  it("Cannot deploy with zero address as owner", async function () {
    const confirmedOwnerArtifact: Artifact = await hre.artifacts.readArtifact(
      "contracts/vendor/ConfirmedOwner.sol:ConfirmedOwner",
    );
    await expect(
      deployContract(this.signers.owner, confirmedOwnerArtifact, [ethers.constants.AddressZero]),
    ).to.be.revertedWith("Cannot set owner to zero");
  });
});
