// SPDX-License-Identifier: MIT

pragma solidity 0.7.6;

import "@chainlink/contracts/src/v0.7/interfaces/AggregatorV2V3Interface.sol";
import "./interfaces/IFeedRegistry.sol";

// This contract sits between AggregatorProxy -> ProxyFacade -> FeedRegistry
// TODO: For the access controls in FeedRegistry to work with this contract, the AggregatorProxy would also need to point to an access controller
// and check that msg.sender hasAccess

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

  // V2
  // function latestAnswer() external view returns (int256);
  // function latestTimestamp() external view returns (uint256);
  // function latestRound() external view returns (uint256);
  // function getAnswer(uint256 roundId) external view returns (int256);
  // function getTimestamp(uint256 roundId) external view returns (uint256);


  // V3

  // function decimals() external view returns (uint8);
  // function description() external view returns (string memory);
  // function version() external view returns (uint256);

  // // getRoundData and latestRoundData should both raise "No data present"
  // // if they do not have data to report, instead of returning unset values
  // // which could be misinterpreted as actual reported values.
  // function getRoundData(uint80 _roundId)
  //   external
  //   view
  //   returns (
  //     uint80 roundId,
  //     int256 answer,
  //     uint256 startedAt,
  //     uint256 updatedAt,
  //     uint80 answeredInRound
  //   );
  // function latestRoundData()
  //   external
  //   view
  //   returns (
  //     uint80 roundId,
  //     int256 answer,
  //     uint256 startedAt,
  //     uint256 updatedAt,
  //     uint80 answeredInRound
  //   );

}