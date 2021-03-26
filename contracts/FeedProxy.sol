// SPDX-License-Identifier: MIT

pragma solidity 0.7.6;

import "@chainlink/contracts/src/v0.7/interfaces/AggregatorV2V3Interface.sol";
import "./interfaces/AccessControllerInterface.sol";
import "./interfaces/IFeedProxy.sol";
import "./FeedRegistry.sol";

contract FeedProxy is IFeedProxy, FeedRegistry {
  // TODO: s_proposedFeeds? for two-step changes?
  // TODO: port phases / currentPhase logic from AggregatorProxy 
  // https://github.com/smartcontractkit/chainlink/blob/develop/evm-contracts/src/v0.6/AggregatorProxy.sol
  mapping(address => mapping(bytes32 => AccessControllerInterface)) public accessControllers;

  function setController(
    address asset,
    bytes32 denomination,
    AccessControllerInterface accessController
  )
    external
    override
    onlyOwner()
  {
    accessControllers[asset][denomination] = AccessControllerInterface(accessController);
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
    returns (int256 price) 
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
    returns (
      uint256 timestamp
    )
  {
    AggregatorV2V3Interface feed = getFeed(asset, denomination);
    return feed.getTimestamp(roundId);
  }

  function latestRoundData(
    address asset,
    bytes32 denomination
  )
    external
    view
    override
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

  /**
   * @dev reverts if the caller does not have access by the accessController
   * contract or is the contract itself.
   */
  modifier checkAccess(
    address asset,
    bytes32 denomination
  ) {
    AccessControllerInterface ac = accessControllers[asset][denomination];
    require(address(ac) == address(0) || ac.hasAccess(msg.sender, msg.data), "No access");
    _;
  }
}