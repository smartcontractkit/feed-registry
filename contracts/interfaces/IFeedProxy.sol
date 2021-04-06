// SPDX-License-Identifier: MIT

pragma solidity 0.7.6;
pragma abicoder v2; // solhint-disable compiler-version

import "@chainlink/contracts/src/v0.7/interfaces/AggregatorV2V3Interface.sol";
import "./IAccessControlled.sol";

interface IFeedProxy is IAccessControlled {
  struct Phase {
    uint16 id;
    AggregatorV2V3Interface feed;
  }

  event FeedProposed(
    address indexed asset, 
    bytes32 indexed denomination,
    address currentFeed,
    address indexed proposedFeed
  );
  event FeedConfirmed(
    address indexed asset, 
    bytes32 indexed denomination,
    address previousFeed,
    address indexed latestFeed
  );

  function proposeFeed(
    address asset,
    bytes32 denomination,
    address feedAddress
  ) external;

  function confirmFeed(
    address asset,
    bytes32 denomination,
    address feedAddress
  ) external;

  function getFeed(
    address asset,
    bytes32 denomination
  )
    external
    view
    returns (
      AggregatorV2V3Interface feed
    );

  function getPhaseFeed(
    address asset,
    bytes32 denomination,
    uint16 phaseId
  )
    external
    view
    returns (
      AggregatorV2V3Interface feed
    );

  function isFeedEnabled(
    AggregatorV2V3Interface feed
  )
    external
    view
    returns (
      bool
    );

  function getCurrentPhase(
    address asset,
    bytes32 denomination
  )
    external
    view
    returns (
      Phase memory currentPhase
    );

  // V2 Aggregator interface
  // https://github.com/smartcontractkit/chainlink/blob/develop/evm-contracts/src/v0.7/interfaces/AggregatorInterface.sol

  function latestAnswer(
    address asset,
    bytes32 denomination
  )
    external
    view
    returns (
      int256 answer
    );

  function latestTimestamp(
    address asset,
    bytes32 denomination
  )
    external
    view
    returns (
      uint256 timestamp
    );

  function latestRound(
    address asset,
    bytes32 denomination
  )
    external
    view
    returns (
      uint256 roundId
    );

  function getAnswer(
    address asset,
    bytes32 denomination,
    uint256 roundId
  )
    external
    view
    returns (
      int256 answer
    );

  function getTimestamp(
    address asset,
    bytes32 denomination,
    uint256 roundId
  )
    external
    view
    returns (
      uint256 timestamp
    );

  // V3 Aggregator interface
  // https://github.com/smartcontractkit/chainlink/blob/develop/evm-contracts/src/v0.7/interfaces/AggregatorV3Interface.sol    

  function decimals(
    address asset,
    bytes32 denomination
  ) 
    external
    view
    returns (
      uint8
    );
  
  function description(
    address asset,
    bytes32 denomination
  )
    external
    view
    returns (
      string memory
    );
    
  function version(
    address asset,
    bytes32 denomination
  )
    external
    view
    returns (
      uint256
    );

  function latestRoundData(
    address asset,
    bytes32 denomination
  )
    external
    view
    returns (
      uint80 roundId,
      int256 answer,
      uint256 startedAt,
      uint256 updatedAt,
      uint80 answeredInRound
    );

  function getRoundData(
    address asset,
    bytes32 denomination,
    uint80 _roundId
  )
    external
    view
    returns (
      uint80 roundId,
      int256 answer,
      uint256 startedAt,
      uint256 updatedAt,
      uint80 answeredInRound
    );

  // Proposed feed

  function getProposedFeed(
    address asset,
    bytes32 denomination
  )
    external
    view
    returns (
      AggregatorV2V3Interface proposedFeed
    );

  function proposedGetRoundData(
    address asset,
    bytes32 denomination,
    uint80 roundId
  )
    external
    view
    returns (
      uint80 id,
      int256 answer,
      uint256 startedAt,
      uint256 updatedAt,
      uint80 answeredInRound
    );

  function proposedLatestRoundData(
    address asset,
    bytes32 denomination
  )
    external
    view
    returns (
      uint80 id,
      int256 answer,
      uint256 startedAt,
      uint256 updatedAt,
      uint80 answeredInRound
    );
}
