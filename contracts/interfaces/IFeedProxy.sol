// SPDX-License-Identifier: MIT

pragma solidity 0.7.6;

import "@chainlink/contracts/src/v0.7/interfaces/AggregatorV2V3Interface.sol";
import "./IFeedRegistry.sol";

interface IFeedProxy is IFeedRegistry {
  function getPrice(address asset, bytes32 denomination) external view returns (int256 answer);

  // TODO: full support for other getters e.g. timestamp, round data
}
