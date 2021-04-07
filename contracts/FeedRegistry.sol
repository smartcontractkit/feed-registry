// SPDX-License-Identifier: MIT

pragma solidity 0.7.6;

import "@chainlink/contracts/src/v0.7/interfaces/AggregatorV2V3Interface.sol";
import "./interfaces/IFeedRegistry.sol";
import "./vendor/Owned.sol";
import "./vendor/Address.sol";

/**
  * @notice Registry contract that maps between token address / denomination pairs to proxies
  */
contract FeedRegistry is IFeedRegistry, Owned {
  using Address for address;

  mapping(address => mapping(uint256 => AggregatorV2V3Interface)) private s_feeds;
  mapping(AggregatorV2V3Interface => bool) private s_isEnabled;

  /**
   * @notice called by the owner to add feeds
   * @param assets is a list of asset / token addresses
   * @param denominations is a list of denomination identifiers
   * @param feeds is a list of feed addresses
   */
  function addFeeds(
    address[] calldata assets,
    uint256[] calldata denominations,
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
    uint256[] calldata denominations
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
    uint256 denomination
  )
    public
    view
    override
    returns (
      AggregatorV2V3Interface feed
    )
  {
    return s_feeds[asset][denomination];
  }

  /**
   * @notice returns true if a feed is enabled for any pair
   */
  function isFeedEnabled(
    AggregatorV2V3Interface feed
  )
    public
    view
    override
    returns (
      bool
    )
  {
    return s_isEnabled[feed];
  }

  function _addFeed(
    address asset,
    uint256 denomination,
    address feedAddress
  )
    internal
  {
    require(feedAddress.isContract(), "feed is not a contract"); // NOTE: this does not work on OVM
    AggregatorV2V3Interface feed = AggregatorV2V3Interface(feedAddress);
    if (s_feeds[asset][denomination] != feed) {
      s_feeds[asset][denomination] = feed;
      s_isEnabled[feed] = true;
      emit FeedSet(asset, denomination, feedAddress);
    }
  }

  function _removeFeed(
    address asset,
    uint256 denomination
  )
    internal
  {
    AggregatorV2V3Interface feed = s_feeds[asset][denomination];
    delete s_feeds[asset][denomination];
    s_isEnabled[feed] = false;
    emit FeedSet(asset, denomination, address(0));
  }
}
