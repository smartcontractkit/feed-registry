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
   * @notice retrieve the latest answer of a feed, given an _asset / _denomination pair
   * or reverts if feed is either unset or has not granted access
   */
  function getPrice(
    address _asset, 
    bytes32 _denomination
  )
    external
    view
    override
    returns (int256 price) 
  {
    AggregatorV2V3Interface feed = getFeed(_asset, _denomination);
    price = feed.latestAnswer();
  }

  // TODO: full support for other getters
}
