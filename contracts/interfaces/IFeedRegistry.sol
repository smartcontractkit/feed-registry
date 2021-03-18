// SPDX-License-Identifier: MIT

pragma solidity 0.7.6;

import "@chainlink/contracts/src/v0.7/interfaces/AggregatorV3Interface.sol";

interface IFeedRegistry {
    event FeedAdded(address indexed asset, bytes32 indexed denomination, address indexed feed);
    event FeedRemoved(address indexed asset, bytes32 indexed denomination, address indexed feed);

    function addFeed(
        address _asset,
        bytes32 _denomination,
        address _feed
    ) external;

    function removeFeed(address _asset, bytes32 _denomination) external;

    function getFeed(address _asset, bytes32 _denomination) external view returns (AggregatorV3Interface feed);

    // TODO
    // function getPrice(address _asset, bytes32 _denomination) returns (int256 answer);
}
