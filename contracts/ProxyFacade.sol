// SPDX-License-Identifier: MIT

pragma solidity 0.7.6;

import "@chainlink/contracts/src/v0.7/interfaces/AggregatorV2V3Interface.sol";
import "./interfaces/IFeedProxy.sol";

// This contract sits between AggregatorProxy -> ProxyFacade -> FeedRegistry
contract ProxyFacade is AggregatorV2V3Interface {
  IFeedProxy private s_feedProxy;
  AccessControllerInterface private s_accessController;
  address private s_asset;
  bytes32 private s_denomination;

  constructor(
    address _feedProxy,
    AccessControllerInterface _accessController,
    address _asset,
    bytes32 _denomination
  ) {
    s_feedProxy = IFeedProxy(_feedProxy);
    s_accessController = _accessController;
    s_asset = _asset;
    s_denomination = _denomination;
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

  function getAccessController() public view returns (AccessControllerInterface) {
    return s_accessController;
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
    external
    view
    override
    checkAccess()
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
    checkAccess()
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
    checkAccess()
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
    checkAccess()
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
    checkAccess()
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
    checkAccess()
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
    checkAccess()
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
    checkAccess()
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
    checkAccess()
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
    checkAccess()
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

  modifier checkAccess() {
    bytes memory callData = abi.encode(s_asset, s_denomination, msg.data); // Includes asset pair (TKN / USD) in payload to access controller
    require(address(s_accessController) == address(0) || s_accessController.hasAccess(msg.sender, callData), "No access");
    _;
  }  
}