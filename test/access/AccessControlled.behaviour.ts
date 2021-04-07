import { expect } from "chai";
import { TEST_ADDRESS } from "../utils/constants";

export function shouldBehaveLikeAccessControlled(): void {
  describe("shouldBehaveLikeAccessControlled", function () {
    it("owner can set access controller", async function () {
      await this.accessControlled.setController(TEST_ADDRESS);
      expect(await this.accessControlled.getController()).to.equal(TEST_ADDRESS);
    });

    it("non-owners cannot set access controller", async function () {
      await expect(this.accessControlled.connect(this.signers.other).setController(TEST_ADDRESS)).to.be.revertedWith(
        "Only callable by owner",
      );
    });
  });
}
