import { BigNumber, ethers, utils } from "ethers";

export const ASSET = "0x0000000000000000000000000000000000000001";
export const DENOMINATION = "0x0000000000000000000000000000000000000002";
export const OTHER_DENOMINATION = "0x0000000000000000000000000000000000000003";
export const TEST_ADDRESS = "0x0000000000000000000000000000000000000008";
export const OTHER_TEST_ADDRESS = "0x0000000000000000000000000000000000000009";
export const PAIR_DATA = ethers.utils.defaultAbiCoder.encode(["address", "address"], [ASSET, DENOMINATION]);
export const OTHER_PAIR_DATA = ethers.utils.defaultAbiCoder.encode(["address", "address"], [ASSET, OTHER_DENOMINATION]);
export const INVALID_PAIR_DATA = ethers.utils.defaultAbiCoder.encode(["address", "int256"], [ASSET, 123]);
export const EMPTY_BYTES = "0x";
export const TEST_DESCRIPTION = "TKN / USD";
export const TEST_DECIMALS = 18;
export const TEST_VERSION = 4;
export const TEST_TIMESTAMP = BigNumber.from("123456789");
export const TEST_ANSWER = utils.parseEther("999999");
export const TEST_ROUND = BigNumber.from("1");
export const TEST_ROUND_DATA = [TEST_ROUND, TEST_ANSWER, TEST_TIMESTAMP, TEST_TIMESTAMP, TEST_ROUND];
export const PHASE_BASE = BigNumber.from(2).pow(64);
export const TEST_PROXY_ROUND = PHASE_BASE.add(TEST_ROUND);
export const TEST_PROXY_ROUND_DATA = [TEST_PROXY_ROUND, TEST_ANSWER, TEST_TIMESTAMP, TEST_TIMESTAMP, TEST_PROXY_ROUND];
export const OTHER_ANSWER = utils.parseEther("888888");
export const OTHER_ROUND = BigNumber.from("123");
export const OTHER_ROUND_DATA = [OTHER_ROUND, OTHER_ANSWER, TEST_TIMESTAMP, TEST_TIMESTAMP, OTHER_ROUND];
