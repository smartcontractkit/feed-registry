// SPDX-License-Identifier: MIT

pragma solidity 0.7.6;

import "@chainlink/contracts/src/v0.7/interfaces/AggregatorV2V3Interface.sol";
import "./interfaces/IFeedRegistry.sol";

// This contract sits between AggreatorProxy -> ProxyFacade -> FeedRegistry
// TODO: is AggregatorV2V3Interface 
contract ProxyFacade {
  IFeedRegistry private s_registry;
  address private s_asset;
  bytes32 private s_denomination;

  constructor(
    address _registry,
    address _asset,
    bytes32 _denomination
  ) {
    s_registry = IFeedRegistry(_registry);
    s_asset = _asset;
    s_denomination = _denomination;
  }

  function registry() public view returns (IFeedRegistry) {
    return s_registry;
  }

  function asset() public view returns (address) {
    return s_asset;
  }

  function denomination() public view returns (bytes32) {
    return s_denomination;
  }

  // TODO: AggregatorV2V3Interface getters that call FeedRegistry getters
}