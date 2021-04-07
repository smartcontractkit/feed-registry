// SPDX-License-Identifier: MIT

pragma solidity 0.7.6;

import "@chainlink/contracts/src/v0.7/interfaces/AggregatorV2V3Interface.sol";

interface IFeedRegistry {
  event FeedSet(
    address indexed asset,
    uint256 indexed denomination,
    address indexed feed
  );

  function addFeeds(
    address[] calldata assets,
    uint256[] calldata denominations,
    address[] calldata feeds
  ) external;

  function removeFeeds(
    address[] calldata assets,
    uint256[] calldata denominations
  ) external;

  function getFeed(
    address asset,
    uint256 denomination
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
