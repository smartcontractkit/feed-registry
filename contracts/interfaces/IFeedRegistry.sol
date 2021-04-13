// SPDX-License-Identifier: MIT

pragma solidity 0.7.6;
pragma abicoder v2; // solhint-disable compiler-version

import "@chainlink/contracts/src/v0.7/interfaces/AggregatorV2V3Interface.sol";
import "./IAccessControlled.sol";

interface IFeedRegistry is IAccessControlled {
  struct Phase {
    uint16 id;
    AggregatorV2V3Interface aggregator;
    uint80 startingRoundId; // TODO: the latest round id of `aggregator`
    uint80 previousPhaseEndingRoundId; // TODO: the latest round of the previous aggregator
  }

  event FeedProposed(
    address indexed asset,
    address indexed denomination,
    address currentAggregator,
    address indexed proposedAggregator
  );
  event FeedConfirmed(
    address indexed asset,
    address indexed denomination,
    address previousAggregator,
    address indexed latestAggregator,
    uint16 nextPhaseId // Track new phase id
  );

  function proposeFeed(
    address asset,
    address denomination,
    address aggregator
  ) external;

  function confirmFeed(
    address asset,
    address denomination,
    address aggregator
  ) external;

  function getFeed(
    address asset,
    address denomination
  )
    external
    view
    returns (
      AggregatorV2V3Interface aggregator
    );

  function getPhaseFeed(
    address asset,
    address denomination,
    uint16 phaseId
  )
    external
    view
    returns (
      AggregatorV2V3Interface aggregator
    );

  function isFeedEnabled(
    address aggregator
  )
    external
    view
    returns (
      bool
    );

  function getCurrentPhase(
    address asset,
    address denomination
  )
    external
    view
    returns (
      Phase memory currentPhase
    );

  // V2 AggregatorInterface

  function latestAnswer(
    address asset,
    address denomination
  )
    external
    view
    returns (
      int256 answer
    );

  function latestTimestamp(
    address asset,
    address denomination
  )
    external
    view
    returns (
      uint256 timestamp
    );

  function latestRound(
    address asset,
    address denomination
  )
    external
    view
    returns (
      uint256 roundId
    );

  function getAnswer(
    address asset,
    address denomination,
    uint256 roundId
  )
    external
    view
    returns (
      int256 answer
    );

  function getTimestamp(
    address asset,
    address denomination,
    uint256 roundId
  )
    external
    view
    returns (
      uint256 timestamp
    );

  // V3 AggregatorV3Interface

  function decimals(
    address asset,
    address denomination
  )
    external
    view
    returns (
      uint8
    );

  function description(
    address asset,
    address denomination
  )
    external
    view
    returns (
      string memory
    );

  function version(
    address asset,
    address denomination
  )
    external
    view
    returns (
      uint256
    );

  function latestRoundData(
    address asset,
    address denomination
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
    address denomination,
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

  // Proposed aggregator

  function getProposedFeed(
    address asset,
    address denomination
  )
    external
    view
    returns (
      AggregatorV2V3Interface proposedAggregator
    );

  function proposedGetRoundData(
    address asset,
    address denomination,
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
    address denomination
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
