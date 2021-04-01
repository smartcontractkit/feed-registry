// SPDX-License-Identifier: MIT

pragma solidity 0.7.6;

import "@chainlink/contracts/src/v0.7/interfaces/AggregatorV2V3Interface.sol";
import "./access/AccessControlled.sol";
import "./interfaces/IFeedProxy.sol";
import "./vendor/Address.sol";

contract FeedProxy is IFeedProxy, AccessControlled {
  using Address for address;

  mapping(address => mapping(bytes32 => AggregatorV2V3Interface)) internal s_feeds;
  mapping(AggregatorV2V3Interface => bool) internal s_isEnabled;
  
  // TODO: s_proposedFeeds? for two-step changes?
  // TODO: port phases / currentPhase logic from AggregatorProxy 
  // https://github.com/smartcontractkit/chainlink/blob/develop/evm-contracts/src/v0.6/AggregatorProxy.sol

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
    bytes32 denomination,
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
    bytes32 denomination
  )
    internal
  {
    AggregatorV2V3Interface feed = s_feeds[asset][denomination];
    delete s_feeds[asset][denomination];
    s_isEnabled[feed] = false;
    emit FeedSet(asset, denomination, address(0));
  }

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
    checkAccess(asset, denomination)
    returns (int256 answer) 
  {
    AggregatorV2V3Interface feed = getFeed(asset, denomination);
    return feed.latestAnswer();
  }

  function latestTimestamp(
    address asset, 
    bytes32 denomination
  )
    external
    view
    override
    checkAccess(asset, denomination)
    returns (uint256 timestamp) 
  {
    AggregatorV2V3Interface feed = getFeed(asset, denomination);
    return feed.latestTimestamp();
  }

  function latestRound(
    address asset,
    bytes32 denomination
  )
    external
    view
    override
    checkAccess(asset, denomination)
    returns (
      uint256 roundId
    ) 
  {
    AggregatorV2V3Interface feed = getFeed(asset, denomination);
    return feed.latestRound();
  }

  function getAnswer(
    address asset,
    bytes32 denomination,
    uint256 roundId
  )
    external
    view
    override
    checkAccess(asset, denomination)
    returns (
      int256 answer
    )
  {
    AggregatorV2V3Interface feed = getFeed(asset, denomination);
    return feed.getAnswer(roundId);
  }

  function getTimestamp(
    address asset,
    bytes32 denomination,
    uint256 roundId
  )
    external
    view
    override
    checkAccess(asset, denomination)
    returns (
      uint256 timestamp
    )
  {
    AggregatorV2V3Interface feed = getFeed(asset, denomination);
    return feed.getTimestamp(roundId);
  }

  function decimals(
    address asset,
    bytes32 denomination
  ) 
    external
    view
    override
    returns (
      uint8
    )
  {
    AggregatorV2V3Interface feed = getFeed(asset, denomination);
    return feed.decimals();
  }
  
  function description(
    address asset,
    bytes32 denomination
  )
    external
    view
    override
    returns (
      string memory
    )
  {
    AggregatorV2V3Interface feed = getFeed(asset, denomination);
    return feed.description();
  }
    
  function version(
    address asset,
    bytes32 denomination
  )
    external
    view
    override
    returns (
      uint256
    )
  {
    AggregatorV2V3Interface feed = getFeed(asset, denomination);
    return feed.version();
  }

  function latestRoundData(
    address asset,
    bytes32 denomination
  )
    external
    view
    override
    checkAccess(asset, denomination)
    returns (
      uint80 roundId,
      int256 answer,
      uint256 startedAt,
      uint256 updatedAt,
      uint80 answeredInRound
    )
  {
    AggregatorV2V3Interface feed = getFeed(asset, denomination);
    return feed.latestRoundData();
  }  

  function getRoundData(
    address asset,
    bytes32 denomination,    
    uint80 _roundId
  )
    external
    view
    override
    checkAccess(asset, denomination)
    returns (
      uint80 roundId,
      int256 answer,
      uint256 startedAt,
      uint256 updatedAt,
      uint80 answeredInRound
    )
  {
    AggregatorV2V3Interface feed = getFeed(asset, denomination);
    return feed.getRoundData(_roundId);
  }

  modifier checkAccess(
    address asset,
    bytes32 denomination
  ) {
    bytes memory callData = abi.encode(asset, denomination, msg.data); // Includes asset pair (TKN / USD) in payload to access controller
    require(address(s_accessController) == address(0) || s_accessController.hasAccess(msg.sender, callData), "No access");
    _;
  }
}