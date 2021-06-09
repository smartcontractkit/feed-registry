import { expect } from "chai";
import { TEST_ADDRESS } from "../utils/constants";

export function shouldBehaveLikeAccessControlled(): void {
  describe("shouldBehaveLikeAccessControlled", function () {
    it("owner can set access controller", async function () {
      await expect(this.accessControlled.setAccessController(TEST_ADDRESS))
        .to.emit(this.accessControlled, "AccessControllerSet")
        .withArgs(TEST_ADDRESS, this.signers.owner.address);
      expect(await this.accessControlled.getAccessController()).to.equal(TEST_ADDRESS);
    });

    it("owner cannot set access controller to the current access controller", async function () {
      await this.accessControlled.setAccessController(TEST_ADDRESS);
      await expect(this.accessControlled.setAccessController(TEST_ADDRESS)).to.be.revertedWith(
        "Access controller is already set",
      );
    });

    it("non-owners cannot set access controller", async function () {
      await expect(
        this.accessControlled.connect(this.signers.other).setAccessController(TEST_ADDRESS),
      ).to.be.revertedWith("Only callable by owner");
    });
  });
}
