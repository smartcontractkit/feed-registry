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
  AccessControllerInterface private s_accessController;

  function setController(
    AccessControllerInterface _accessController
  )
    external
    override
    onlyOwner()
  {
    s_accessController = _accessController;
  }

  function accessController() public view returns (AccessControllerInterface) {
    return s_accessController;
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

  /**
   * @dev reverts if the caller does not have access to the feed
   * contract or is the contract itself.
   */
  modifier checkAccess(
    address asset,
    bytes32 denomination
  ) {
    // TODO: with a ProxyFacade in between, msg.sender will be the facade address instead of the consumer address
    bytes memory callData = abi.encode(asset, denomination, msg.data); // Include asset pair in payload to access controller
    require(address(s_accessController) == address(0) || s_accessController.hasAccess(msg.sender, callData), "No access");
    _;
  }
}