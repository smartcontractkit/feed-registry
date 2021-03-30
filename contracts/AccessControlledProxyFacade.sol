// SPDX-License-Identifier: MIT

pragma solidity 0.7.6;

import "./interfaces/IFeedProxy.sol";
import "./ProxyFacade.sol";

// ProxyFacade with access controls
contract AccessControlledProxyFacade is ProxyFacade, Owned {
  AccessControllerInterface internal s_accessController;

  constructor(
    AccessControllerInterface accessController,
    address feedProxy,
    address asset,
    bytes32 denomination
  ) ProxyFacade(feedProxy, asset, denomination) {
    s_accessController = accessController;
  }

  function setController(
    AccessControllerInterface _accessController
  )
    public
    onlyOwner()
  {
    s_accessController = _accessController;
  }

  function getAccessController() public view returns (AccessControllerInterface) {
    return s_accessController;
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
    bytes memory callData = abi.encode(s_asset, s_denomination, msg.data); // Includes asset pair (TKN / USD) in payload to access controller
    require(address(s_accessController) == address(0) || s_accessController.hasAccess(msg.sender, callData), "No access");
    _;
  }  
}