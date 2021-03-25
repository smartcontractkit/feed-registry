// SPDX-License-Identifier: MIT

pragma solidity 0.7.6;

import "@chainlink/contracts/src/v0.7/interfaces/AggregatorV2V3Interface.sol";
import "./interfaces/IFeedRegistry.sol";
import "./vendor/Owned.sol";
import "./vendor/Address.sol";

contract FeedRegistry is IFeedRegistry, Owned {
  using Address for address;

  mapping(address => mapping(bytes32 => AggregatorV2V3Interface)) internal s_feeds;
  mapping(AggregatorV2V3Interface => bool) internal s_isEnabled;

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
    return AggregatorV2V3Interface(s_feeds[asset][denomination]);
  }

  /**
   * @notice returns true if a feed is enabled for any pair
   */
  function isFeedEnabled(
    AggregatorV2V3Interface feed
  )
    public
    override
    view
    returns (
      bool
    )
  {
    return s_isEnabled[feed];
  }

  function _addFeed(
    address asset,
    bytes32 denomination,
    address feedAddress
  )
    internal
  {
    require(feedAddress.isContract(), "feed is not a contract");
    AggregatorV2V3Interface feed = AggregatorV2V3Interface(feedAddress);
    if (s_feeds[asset][denomination] != feed) {
      s_feeds[asset][denomination] = feed;
      s_isEnabled[feed] = true;
      emit FeedSet(asset, denomination, feedAddress);
    }
  }

  function _removeFeed(
    address asset,
    bytes32 denomination
  )
    internal
  {
    AggregatorV2V3Interface feed = s_feeds[asset][denomination];
    delete s_feeds[asset][denomination];
    s_isEnabled[feed] = false;
    emit FeedSet(asset, denomination, address(0));
  }
}
