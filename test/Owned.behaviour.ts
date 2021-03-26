import { expect } from "chai";

export function shouldBehaveLikeOwned(): void {
  it("should assign ownership to the deployer", async function () {
    expect(await this.registry.owner()).to.equal(this.signers.owner.address);
  });

  it("non-owners cannot transferOwnership", async function () {
    await expect(
      this.registry.connect(this.signers.other).transferOwnership(this.signers.other.address),
    ).to.be.revertedWith("Only callable by owner");
  });

  it("owners can transferOwnership", async function () {
    await expect(this.registry.connect(this.signers.owner).transferOwnership(this.signers.other.address))
      .to.emit(this.registry, "OwnershipTransferRequested")
      .withArgs(this.signers.owner.address, this.signers.other.address);
  });

  it("pending owners can acceptOwnership", async function () {
    expect(await this.registry.owner()).to.equal(this.signers.owner.address);

    await this.registry.connect(this.signers.owner).transferOwnership(this.signers.other.address);
    await expect(this.registry.connect(this.signers.other).acceptOwnership())
      .to.emit(this.registry, "OwnershipTransferred")
      .withArgs(this.signers.owner.address, this.signers.other.address);

    expect(await this.registry.owner()).to.equal(this.signers.other.address);
  });
}
