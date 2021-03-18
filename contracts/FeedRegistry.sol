// SPDX-License-Identifier: MIT

pragma solidity 0.7.6;

import "@chainlink/contracts/src/v0.7/interfaces/AggregatorV3Interface.sol";
import "./interfaces/IFeedRegistry.sol";
import "./vendor/Owned.sol";

// import "./vendor/Address.sol";

contract FeedRegistry is IFeedRegistry, Owned {
    mapping(address => mapping(bytes32 => AggregatorV3Interface)) private feeds;

    // constructor() {
    //     // TODO: accept an initial mapping?
    // }

    // TODO: support multiple
    function addFeed(
        address _asset,
        bytes32 _denomination,
        address _feed
    ) external override onlyOwner {
        _addFeed(_asset, _denomination, _feed);
    }

    // TODO: support multiple
    function removeFeed(address _asset, bytes32 _denomination) external override onlyOwner {
        _removeFeed(_asset, _denomination);
    }

    function getFeed(address _asset, bytes32 _denomination)
        external
        view
        override
        returns (AggregatorV3Interface proxy)
    {
        return AggregatorV3Interface(feeds[_asset][_denomination]);
    }

    function _addFeed(
        address _asset,
        bytes32 _denomination,
        address _feed
    ) internal {
        // require(_feed.isContract(), "_feed is not a contract");
        feeds[_asset][_denomination] = AggregatorV3Interface(_feed);
        // TODO: emit event
    }

    function _removeFeed(address _asset, bytes32 _denomination) internal {
        delete feeds[_asset][_denomination];
        // TODO: emit event
    }
}
