// SPDX-License-Identifier: MIT

pragma solidity 0.7.6;

import "@chainlink/contracts/src/v0.7/interfaces/AggregatorV2V3Interface.sol";
import "./vendor/Owned.sol";
import "./interfaces/IFeedProxy.sol";

/**
  * @notice facade proxy contract that conforms to the AggregatorV2V3Interface.
  * This contract sits between AggregatorProxy -> ProxyFacade -> FeedRegistry
  */
contract ProxyFacade is AggregatorV2V3Interface {
  IFeedProxy internal immutable s_feedProxy;
  address internal immutable s_asset;
  bytes32 internal immutable s_denomination;
  // TODO: s_reader // intended reader who is allowed to read (usually the proxy address)

  constructor(
    address feedProxy,
    address asset,
    bytes32 denomination
  ) {
    s_feedProxy = IFeedProxy(feedProxy);
    s_asset = asset;
    s_denomination = denomination;
  }

  function getFeedProxy()
    public
    view
    returns (
      IFeedProxy
    )
  {
    return s_feedProxy;
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
      bytes32
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
    return s_feedProxy.latestAnswer(s_asset, s_denomination);
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
    return s_feedProxy.latestTimestamp(s_asset, s_denomination);
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
    return s_feedProxy.latestRound(s_asset, s_denomination);
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
    return s_feedProxy.getAnswer(s_asset, s_denomination, roundId);
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
    return s_feedProxy.getTimestamp(s_asset, s_denomination, roundId);
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
    return s_feedProxy.decimals(s_asset, s_denomination);
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
    return s_feedProxy.description(s_asset, s_denomination);
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
    return s_feedProxy.version(s_asset, s_denomination);
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
    return s_feedProxy.getRoundData(s_asset, s_denomination, _roundId);
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
    return s_feedProxy.latestRoundData(s_asset, s_denomination);
  }
}
