// SPDX-License-Identifier: MIT

pragma solidity 0.7.6;

import "@chainlink/contracts/src/v0.7/interfaces/AggregatorV2V3Interface.sol";
import "./interfaces/IFeedRegistry.sol";
import "./vendor/Owned.sol";
import "./vendor/Address.sol";

contract FeedRegistry is IFeedRegistry, Owned {
  using Address for address;

  mapping(address => mapping(bytes32 => AggregatorV2V3Interface)) internal s_feeds;

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
  ) external override onlyOwner() {
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
  function removeFeeds(address[] calldata assets, bytes32[] calldata denominations) external override onlyOwner() {
    require(assets.length == denominations.length, "need same assets and denominations count");
    for (uint256 i = 0; i < assets.length; i++) {
      _removeFeed(assets[i], denominations[i]);
    }
  }

  /**
   * @notice retrieve the feed of an _asset / _denomination pair
   */
  function getFeed(address _asset, bytes32 _denomination) public view override returns (AggregatorV2V3Interface proxy) {
    return AggregatorV2V3Interface(s_feeds[_asset][_denomination]);
  }

  function _addFeed(
    address _asset,
    bytes32 _denomination,
    address _feed
  ) internal {
    require(_feed.isContract(), "_feed is not a contract");
    if (s_feeds[_asset][_denomination] != AggregatorV2V3Interface(_feed)) {
      s_feeds[_asset][_denomination] = AggregatorV2V3Interface(_feed);
      emit FeedUpdated(_asset, _denomination, _feed);
    }
  }

  function _removeFeed(address _asset, bytes32 _denomination) internal {
    delete s_feeds[_asset][_denomination];
    emit FeedUpdated(_asset, _denomination, address(0));
  }
}
