// SPDX-License-Identifier: MIT

pragma solidity 0.7.6;

import "@chainlink/contracts/src/v0.7/interfaces/AggregatorV2V3Interface.sol";
import "./vendor/Owned.sol";
import "./interfaces/IFeedRegistry.sol";

/**
  * @notice facade proxy contract that conforms to the AggregatorV2V3Interface.
  * This contract sits between AggregatorProxy -> ProxyFacade -> FeedRegistry
  */
contract ProxyFacade is AggregatorV2V3Interface {
  IFeedRegistry internal immutable s_FeedRegistry;
  address internal immutable s_asset;
  uint256 internal immutable s_denomination;

  constructor(
    address FeedRegistry,
    address asset,
    uint256 denomination
  ) {
    s_FeedRegistry = IFeedRegistry(FeedRegistry);
    s_asset = asset;
    s_denomination = denomination;
  }

  function getFeedRegistry()
    public
    view
    returns (
      IFeedRegistry
    )
  {
    return s_FeedRegistry;
  }

  function getAsset()
    public
    view
    returns (
      address
    )
  {
    return s_asset;
  }

  function getDenomination()
    public
    view
    returns (
      uint256
    )
  {
    return s_denomination;
  }

  // V2

  function latestAnswer()
    public
    view
    virtual
    override
    returns
    (
      int256
    )
  {
    return s_FeedRegistry.latestAnswer(s_asset, s_denomination);
  }

  function latestTimestamp()
    public
    view
    virtual
    override
    returns (
      uint256
    )
  {
    return s_FeedRegistry.latestTimestamp(s_asset, s_denomination);
  }

  function latestRound()
    public
    view
    virtual
    override
    returns (
      uint256
    )
  {
    return s_FeedRegistry.latestRound(s_asset, s_denomination);
  }

  function getAnswer(
    uint256 roundId
  )
    public
    view
    virtual
    override
    returns (
      int256
    )
  {
    return s_FeedRegistry.getAnswer(s_asset, s_denomination, roundId);
  }

  function getTimestamp(
    uint256 roundId
  )
    public
    view
    virtual
    override
    returns (
      uint256
    )
  {
    return s_FeedRegistry.getTimestamp(s_asset, s_denomination, roundId);
  }

  // V3

  function decimals()
    public
    view
    virtual
    override
    returns (
      uint8
    )
  {
    return s_FeedRegistry.decimals(s_asset, s_denomination);
  }

  function description()
    public
    view
    virtual
    override
    returns (
      string memory
    )
  {
    return s_FeedRegistry.description(s_asset, s_denomination);
  }

  function version()
    public
    view
    virtual
    override
    returns (
      uint256
    )
  {
    return s_FeedRegistry.version(s_asset, s_denomination);
  }

  function getRoundData(uint80 _roundId)
    public
    view
    virtual
    override
    returns (
      uint80 roundId,
      int256 answer,
      uint256 startedAt,
      uint256 updatedAt,
      uint80 answeredInRound
    )
  {
    return s_FeedRegistry.getRoundData(s_asset, s_denomination, _roundId);
  }

  function latestRoundData()
    public
    view
    virtual
    override
    returns (
      uint80 roundId,
      int256 answer,
      uint256 startedAt,
      uint256 updatedAt,
      uint80 answeredInRound
    )
  {
    return s_FeedRegistry.latestRoundData(s_asset, s_denomination);
  }
}
