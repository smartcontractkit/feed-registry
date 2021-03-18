// SPDX-License-Identifier: MIT

pragma solidity 0.7.6;

import "@chainlink/contracts/src/v0.7/interfaces/AggregatorV3Interface.sol";

interface IFeedRegistry {
  event FeedAdded(
    address indexed asset,
    bytes32 indexed denomination,
    address indexed proxy
  );
  event FeedRemoved(
    address indexed asset,
    bytes32 indexed denomination,
    address indexed proxy
  );

  function addFeed(address _asset, bytes32 _denomination, address _proxy) external;
  function removeFeed(address _asset, bytes32 _denomination) external;
  function getFeed(address _asset, bytes32 _denomination) external view returns (AggregatorV3Interface proxy);

  // TODO
  // function getPrice(address _asset, bytes32 _denomination) returns (int256 answer);
}