// SPDX-License-Identifier: MIT

pragma solidity 0.7.6;

import "@chainlink/contracts/src/v0.7/interfaces/AggregatorV2V3Interface.sol";
import "./interfaces/IFeedProxy.sol";
import "./FeedRegistry.sol";

contract FeedProxy is IFeedProxy, FeedRegistry {
  // TODO: proxy access controls

  // address delegate
  // TODO: https://github.com/OpenZeppelin/openzeppelin-contracts/blob/master/contracts/proxy/Proxy.sol

  /**
   * @notice retrieve the latest answer of a feed, given an asset / denomination pair
   * or reverts if feed is either unset or has not granted access
   */
  function latestAnswer(
    address asset, 
    bytes32 denomination
  )
    external
    view
    override
    returns (int256 price) 
  {
    AggregatorV2V3Interface feed = getFeed(asset, denomination);
    price = feed.latestAnswer();
  }

  function latestTimestamp(
    address asset, 
    bytes32 denomination
  )
    external
    view
    override
    returns (uint256 timestamp) 
  {
    AggregatorV2V3Interface feed = getFeed(asset, denomination);
    timestamp = feed.latestTimestamp();
  }

  function latestRound(
    address asset,
    bytes32 denomination
  )
    external
    override
    view
    returns (
      uint256 roundId
    ) 
  {
    AggregatorV2V3Interface feed = getFeed(asset, denomination);
    roundId = feed.latestRound();
  }

  // TODO: full support for other getters
}