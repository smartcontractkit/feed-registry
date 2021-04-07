import { ethers } from "ethers";

export const TEST_ADDRESS = "0x0000000000000000000000000000000000000002";
export const ASSET_ADDRESS = "0x0000000000000000000000000000000000000001";
export const DENOMINATION = 1;
export const PAIR_DATA = ethers.utils.defaultAbiCoder.encode(["address", "uint256"], [ASSET_ADDRESS, DENOMINATION]);
export const INVALID_PAIR_DATA = ethers.utils.defaultAbiCoder.encode(["address", "int256"], [ASSET_ADDRESS, 123]);
export const OTHER_DENOMINATION = 2;
export const OTHER_PAIR_DATA = ethers.utils.defaultAbiCoder.encode(
  ["address", "uint256"],
  [ASSET_ADDRESS, OTHER_DENOMINATION],
);
export const EMPTY_BYTES = "0x";
