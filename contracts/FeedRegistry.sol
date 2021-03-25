// SPDX-License-Identifier: MIT

pragma solidity 0.7.6;

import "@chainlink/contracts/src/v0.7/interfaces/AggregatorV2V3Interface.sol";
import "./interfaces/IFeedRegistry.sol";
import "./vendor/Owned.sol";
import "./vendor/Address.sol";

contract FeedRegistry is IFeedRegistry, Owned {
  using Address for address;

  mapping(address => mapping(bytes32 => AggregatorV2V3Interface)) internal sfeeds;

  /**
   * @notice called by the owner to add feeds
   * @param assets is a list of asset / token addresses
   * @param denominations is a list of denomination identifiers
   * @param feeds is a list of feed addresses
   */
  function addFeeds(
    address[] calldata assets,
    bytes32[] calldata denominations,
    address[] calldata feeds
  ) 
    external
    override
    onlyOwner()
  {
    require(assets.length == denominations.length, "need same assets and denominations count");
    require(assets.length == feeds.length, "need same assets and feeds count");
    for (uint256 i = 0; i < assets.length; i++) {
      _addFeed(assets[i], denominations[i], feeds[i]);
    }
  }

  /**
   * @notice called by the owner to remove feeds
   * @param assets is a list of asset / token addresses
   * @param denominations is a list of denomination identifiers
   */
  function removeFeeds(
    address[] calldata assets,
    bytes32[] calldata denominations
  )
    external
    override
    onlyOwner()
  {
    require(assets.length == denominations.length, "need same assets and denominations count");
    for (uint256 i = 0; i < assets.length; i++) {
      _removeFeed(assets[i], denominations[i]);
    }
  }

  /**
   * @notice retrieve the feed of an asset / denomination pair
   */
  function getFeed(
    address asset,
    bytes32 denomination
  )
    public
    view
    override
    returns (
      AggregatorV2V3Interface feed
    )
  {
    return AggregatorV2V3Interface(sfeeds[asset][denomination]);
  }

  function _addFeed(
    address asset,
    bytes32 denomination,
    address feed
  )
    internal
  {
    require(feed.isContract(), "feed is not a contract");
    if (sfeeds[asset][denomination] != AggregatorV2V3Interface(feed)) {
      sfeeds[asset][denomination] = AggregatorV2V3Interface(feed);
      emit FeedSet(asset, denomination, feed);
    }
  }

  function _removeFeed(
    address asset,
    bytes32 denomination
  )
    internal
  {
    delete sfeeds[asset][denomination];
    emit FeedSet(asset, denomination, address(0));
  }
}
