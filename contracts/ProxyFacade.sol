// SPDX-License-Identifier: MIT

pragma solidity 0.7.6;

import "@chainlink/contracts/src/v0.7/interfaces/AggregatorV2V3Interface.sol";
import "./interfaces/IFeedProxy.sol";

// This contract sits between AggregatorProxy -> ProxyFacade -> FeedRegistry
// TODO: For the access controls in FeedRegistry to work with this contract:
// - Both ProxyFacade and AggregatorProxy would also need to point to the feedProxy's access controller
// and check that msg.sender hasAccess

contract ProxyFacade is AggregatorV2V3Interface {
  IFeedProxy private s_feedProxy;
  address private s_asset;
  bytes32 private s_denomination;
  // TODO: accessController will be needed here for access controls to be enforcable

  constructor(
    address _feedProxy,
    address _asset,
    bytes32 _denomination
  ) {
    s_feedProxy = IFeedProxy(_feedProxy);
    s_asset = _asset;
    s_denomination = _denomination;
  }

  function feedProxy()
    public
    view
    returns (
      IFeedProxy
    )
  {
    return s_feedProxy;
  }

  function asset()
    public
    view
    returns (
      address
    )
  {
    return s_asset;
  }

  function denomination()
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
    external
    view
    override
    returns
    (
      int256
    )
  {
    return s_feedProxy.latestAnswer(s_asset, s_denomination);
  }
  
  function latestTimestamp() 
    external
    view
    override
    returns (
      uint256
    )
  {
    return s_feedProxy.latestTimestamp(s_asset, s_denomination);
  }

  function latestRound() 
    external
    view
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
    external
    view
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
    external
    view
    override
    returns (
      uint256
    )
  {
    return s_feedProxy.getTimestamp(s_asset, s_denomination, roundId);
  }

  // V3

  function decimals() 
    external
    view
    override
    returns (
      uint8
    )
  {
    return s_feedProxy.decimals(s_asset, s_denomination);
  }
  
  function description() 
    external
    view
    override
    returns (
      string memory
    )
  {
    return s_feedProxy.description(s_asset, s_denomination);
  }
  
  function version() 
    external
    view
    override
    returns (
      uint256
    )
  {
    return s_feedProxy.version(s_asset, s_denomination);
  }

  function getRoundData(uint80 _roundId)
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
    return s_feedProxy.getRoundData(s_asset, s_denomination, _roundId);
  }

  function latestRoundData()
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
    return s_feedProxy.latestRoundData(s_asset, s_denomination);
  }
}