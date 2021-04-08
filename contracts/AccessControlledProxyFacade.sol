// SPDX-License-Identifier: MIT

pragma solidity 0.7.6;

import "./interfaces/IFeedRegistry.sol";
import "./ProxyFacade.sol";

/**
  * @notice facade proxy contract that conforms to the AggregatorV2V3Interface. Implements access controls.
  */
contract AccessControlledProxyFacade is ProxyFacade {
  address private immutable s_allowedReader; // intended reader who is allowed to read (usually the proxy address)

  constructor(
    address allowedReader,
    address FeedRegistry,
    address asset,
    uint256 denomination
  ) ProxyFacade(FeedRegistry, asset, denomination) {
    require(allowedReader != address(0), "Invalid allowed reader");
    s_allowedReader = allowedReader;
  }

  function getAllowedReader()
    external
    view
    returns (
      address
    )
  {
    return s_allowedReader;
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
    require(msg.sender == address(0) || msg.sender == s_allowedReader, "No access");
    _;
  }
}
