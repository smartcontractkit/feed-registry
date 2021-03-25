// SPDX-License-Identifier: MIT

pragma solidity 0.7.6;

import "@chainlink/contracts/src/v0.7/interfaces/AggregatorV2V3Interface.sol";

interface IFeedRegistry {
  event FeedSet(
    address indexed asset, 
    bytes32 indexed denomination, 
    address indexed feed
  );

  function addFeeds(
    address[] calldata assets,
    bytes32[] calldata denominations,
    address[] calldata feeds
  ) external;

  function removeFeeds(
    address[] calldata assets,
    bytes32[] calldata denominations
  ) external;

  function getFeed(
    address asset,
    bytes32 denomination
  )
    external
    view
    returns (
      AggregatorV2V3Interface feed
    );

  function isFeedEnabled(
    AggregatorV2V3Interface feed
  )
    external
    view
    returns (
      bool
    );
}
