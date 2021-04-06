// SPDX-License-Identifier: MIT

pragma solidity 0.7.6;

import "./access/AccessControlled.sol";
import "./vendor/AccessControllerInterface.sol";
import "./interfaces/IFeedProxy.sol";
import "./ProxyFacade.sol";

/**
  * @notice facade proxy contract that conforms to the AggregatorV2V3Interface. Implements access controls.
  */
contract AccessControlledProxyFacade is ProxyFacade, AccessControlled {
  constructor(
    AccessControllerInterface accessController,
    address feedProxy,
    address asset,
    bytes32 denomination
  ) ProxyFacade(feedProxy, asset, denomination) {
    setController(accessController);
  }

  // V2

  function latestAnswer()
    public
    view
    override
    checkAccess()
    returns
    (
      int256
    )
  {
    return super.latestAnswer();
  }
  
  function latestTimestamp() 
    public
    view
    override
    checkAccess()
    returns (
      uint256
    )
  {
    return super.latestTimestamp();
  }

  function latestRound() 
    public
    view
    override
    checkAccess()
    returns (
      uint256
    )
  {
    return super.latestRound();
  }
  
  function getAnswer(
    uint256 roundId
  )
    public
    view
    override
    checkAccess()
    returns (
      int256
    )
  {
    return super.getAnswer(roundId);
  }
  
  function getTimestamp(
    uint256 roundId
  )
    public
    view
    override
    checkAccess()
    returns (
      uint256
    )
  {
    return super.getTimestamp(roundId);
  }

  // V3

  function decimals() 
    public
    view
    override
    checkAccess()
    returns (
      uint8
    )
  {
    return super.decimals();
  }
  
  function description() 
    public
    view
    override
    checkAccess()
    returns (
      string memory
    )
  {
    return super.description();
  }
  
  function version() 
    public
    view
    override
    checkAccess()
    returns (
      uint256
    )
  {
    return super.version();
  }

  function getRoundData(uint80 _roundId)
    public
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
    return super.getRoundData(_roundId);
  }

  function latestRoundData()
    public
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
    return super.latestRoundData();
  }

  modifier checkAccess() {
    bytes memory callData = abi.encode(s_asset, s_denomination, msg.data); // Send feed idenfitier (TKN / USD) to access controller
    require(address(s_accessController) == address(0) || s_accessController.hasAccess(msg.sender, callData), "No access");
    _;
  }  
}