// SPDX-License-Identifier: MIT

pragma solidity 0.7.6;

import "@chainlink/contracts/src/v0.7/interfaces/AggregatorV2V3Interface.sol";
import "./IFeedRegistry.sol";
import "./AccessControllerInterface.sol";

interface IFeedProxy is IFeedRegistry {
  event AccessControllerSet(
    address indexed asset, 
    bytes32 indexed denomination, 
    address indexed accessController
  );

  function setController(
    address asset,
    bytes32 denomination,
    AccessControllerInterface accessController
  ) external;

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

  // function getAnswer(
  //   address asset,
  //   bytes32 denomination,
  //   uint256 roundId
  // )
  //   external
  //   view
  //   returns (
  //     uint256 timestamp
  //   );

  // function getAnswer(
  //   address asset,
  //   bytes32 denomination,
  //   uint256 roundId
  // )
  //   external
  //   view
  //   returns (
  //     int256 answer
  //   );

  // function getTimestamp(
  //   address asset,
  //   bytes32 denomination,
  //   uint256 roundId
  // )
  //   external
  //   view
  //   returns (
  //     uint256 timestamp
  //   );

  // V3 Aggregator interface
  // https://github.com/smartcontractkit/chainlink/blob/develop/evm-contracts/src/v0.7/interfaces/AggregatorV3Interface.sol    

  // function latestRoundData(
  //   address asset,
  //   bytes32 denomination
  // )
  //   external
  //   view
  //   returns (
  //     uint80 roundId,
  //     int256 answer,
  //     uint256 startedAt,
  //     uint256 updatedAt,
  //     uint80 answeredInRound
  //   );

  // function getRoundData(
  //   address asset,
  //   bytes32 denomination,    
  //   uint80 _roundId
  // )
  //   external
  //   view
  //   returns (
  //     uint80 roundId,
  //     int256 answer,
  //     uint256 startedAt,
  //     uint256 updatedAt,
  //     uint80 answeredInRound
  //   );

}
