// SPDX-License-Identifier: MIT

pragma solidity 0.7.6;
pragma abicoder v2; // solhint-disable compiler-version

import "@chainlink/contracts/src/v0.7/interfaces/AggregatorV2V3Interface.sol";
import "./access/AccessControlled.sol";
import "./interfaces/IFeedRegistry.sol";
import "./interfaces/TypeAndVersionInterface.sol";
import "./libraries/Denominations.sol";

/**
  * @notice An on-chain registry of assets to aggregators.
  * @notice This contract provides a consistent address for consumers but delegates where it reads from to the owner, who is
  * trusted to update it. This registry contract works for multiple feeds, not just a single aggregator.
  * @notice Only access enabled addresses are allowed to access getters for answers and round data
  */
contract FeedRegistry is IFeedRegistry, AccessControlled, TypeAndVersionInterface {
  uint256 constant private PHASE_OFFSET = 64;
  uint256 constant private PHASE_SIZE = 16;
  uint256 constant private MAX_ID = 2**(PHASE_OFFSET+PHASE_SIZE) - 1;

  mapping(address => bool) private s_isAggregatorEnabled;
  mapping(address => mapping(address => AggregatorV2V3Interface)) private s_proposedAggregators;
  mapping(address => mapping(address => uint16)) private s_currentPhaseId;
  mapping(address => mapping(address => mapping(uint16 => Phase))) private s_phases; // Current and past phases

  /*
   * Versioning
   */
  function typeAndVersion()
    external
    override
    pure
    virtual
    returns (
      string memory
    )
  {
    return "FeedRegistry 1.0.0";
  }

  /**
   * @notice Allows the owner to propose a new address for the aggregator
   * @param asset asset address
   * @param denomination denomination address
   * @param aggregator The new aggregator contract address
   */
  function proposeFeed(
    address asset,
    address denomination,
    address aggregator
  )
    external
    override
    onlyOwner()
  {
    Phase memory currentPhase = getCurrentPhase(asset, denomination);
    s_proposedAggregators[asset][denomination] = AggregatorV2V3Interface(aggregator);
    emit FeedProposed(asset, denomination, aggregator, address(currentPhase.aggregator));
  }

  /**
   * @notice Allows the owner to confirm and change the address
   * to the proposed aggregator
   * @dev Reverts if the given address doesn't match what was previously
   * proposed
   * @param asset asset address
   * @param denomination denomination address
   * @param aggregator The new aggregator contract address
   */
  function confirmFeed(
    address asset,
    address denomination,
    address aggregator
  )
    external
    override
    onlyOwner()
  {
    require(aggregator == address(s_proposedAggregators[asset][denomination]), "Invalid proposed aggregator");
    (uint16 nextPhaseId, address previousAggregator) = _setFeed(asset, denomination, aggregator);
    s_isAggregatorEnabled[aggregator] = true;
    s_isAggregatorEnabled[previousAggregator] = false;
    emit FeedConfirmed(asset, denomination, aggregator, previousAggregator, nextPhaseId);
  }

  /**
   * @notice retrieve the aggregator of an asset / denomination pair in the current phase
   * @param asset asset address
   * @param denomination denomination address
   * @return aggregator
   */
  function getFeed(
    address asset,
    address denomination
  )
    public
    view
    override
    returns (
      AggregatorV2V3Interface aggregator
    )
  {
    Phase memory currentPhase = getCurrentPhase(asset, denomination);
    return currentPhase.aggregator;
  }

  /**
   * @notice retrieve the aggregator of an asset / denomination pair at a specific phase
   * @param asset asset address
   * @param denomination denomination address
   * @param phaseId phase ID
   * @return aggregator
   */
  function getPhaseFeed(
    address asset,
    address denomination,
    uint16 phaseId
  )
    public
    view
    override
    returns (
      AggregatorV2V3Interface aggregator
    )
  {
    return AggregatorV2V3Interface(s_phases[asset][denomination][phaseId].aggregator);
  }

  /**
   * @notice returns true if a aggregator is enabled for any pair
   * @param aggregator aggregator address
   */
  function isFeedEnabled(
    address aggregator
  )
    public
    view
    override
    returns (
      bool
    )
  {
    return s_isAggregatorEnabled[aggregator];
  }

  /**
   * @notice returns a feed's current phase
   * @param asset asset address
   * @param denomination denomination address
   * @return currentPhase is the feed's current phase
   */
  function getCurrentPhase(
    address asset,
    address denomination
  )
    public
    view
    override
    returns (
      Phase memory currentPhase
    )
  {
    uint16 currentPhaseId = s_currentPhaseId[asset][denomination];
    return s_phases[asset][denomination][currentPhaseId];
  }

  /**
   * @notice returns specified phase by id
   * @param asset asset address
   * @param denomination denomination address
   * @param phaseId phase id
   * @return phase
   */
  function getPhase(
    address asset,
    address denomination,
    uint16 phaseId
  )
    public
    view
    override
    returns (
      Phase memory phase
    )
  {
    return s_phases[asset][denomination][phaseId];
  }

  /**
   * @notice retrieve the aggregator of an asset / denomination pair at a specific round id
   * @param asset asset address
   * @param denomination denomination address
   * @param roundId the proxy round id
   */
  function getRoundFeed(
    address asset,
    address denomination,
    uint80 roundId
  )
    public
    view
    override
    returns (
      AggregatorV2V3Interface aggregator
    )
  {
    return _getPhaseByRound(asset, denomination, roundId).aggregator;
  }

  /**
   * @notice return the previous round id of a given round
   * @param asset asset address
   * @param denomination denomination address
   * @param roundId the round id number to retrieve the updated timestamp for
   * @dev Note that this is not the aggregator round id, but the proxy round id
   * To get full ranges of round ids of different phases, use getRoundRange()
   * @return previousRoundId
   */
  function getPreviousRoundId(
    address asset,
    address denomination,
    uint80 roundId
  ) external
    view
    override
    returns (
      uint80 previousRoundId
    )
  {
    Phase memory phase = _getPhaseByRound(asset, denomination, roundId);
    return _getPreviousRoundId(asset, denomination, phase.id, roundId);
  }

  /**
   * @notice return the next round id of a given round
   * @param asset asset address
   * @param denomination denomination address
   * @param roundId the round id number to retrieve the updated timestamp for
   * @dev Note that this is not the aggregator round id, but the proxy round id
   * To get full ranges of round ids of different phases, use getRoundRange()
   * @return nextRoundId
   */
  function getNextRoundId(
    address asset,
    address denomination,
    uint80 roundId
  ) external
    view
    override
    returns (
      uint80 nextRoundId
    )
  {
    Phase memory phase = _getPhaseByRound(asset, denomination, roundId);
    return _getNextRoundId(asset, denomination, phase.id, roundId);
  }

  /**
   * @notice returns the range of proxy round ids of a phase
   * @param asset asset address
   * @param denomination denomination address
   * @param phaseId phase id
   * @return startingRoundId
   * @return endingRoundId
   */
  function getRoundRange(
    address asset,
    address denomination,
    uint16 phaseId
  )
    public
    view
    override
    returns (
      uint80 startingRoundId,
      uint80 endingRoundId
    )
  {
    Phase memory phase = s_phases[asset][denomination][phaseId];
    Phase memory currentPhase = getCurrentPhase(asset, denomination);
    if (phase.id == currentPhase.id) return _getLatestRoundRange(currentPhase);
    return _getRoundRange(phase);
  }

  /**
   * @notice Reads the current answer for an asset / denomination pair's aggregator.
   * @param asset asset address
   * @param denomination denomination address
   * @notice We advise to use latestRoundData() instead because it returns more in-depth information.
   * @dev This does not error if no answer has been reached, it will simply return 0. Either wait to point to
   * an already answered Aggregator or use the recommended latestRoundData
   * instead which includes better verification information.
   */
  function latestAnswer(
    address asset,
    address denomination
  )
    external
    view
    override
    checkAccess(asset, denomination)
    returns (
      int256 answer
    )
  {
    AggregatorV2V3Interface aggregator = getFeed(asset, denomination);
    return aggregator.latestAnswer();
  }

  /**
   * @notice get the latest completed round where the answer was updated. This
   * @param asset asset address
   * @param denomination denomination address
   * ID includes the proxy's phase, to make sure round IDs increase even when
   * switching to a newly deployed aggregator.
   *
   * @notice We advise to use latestRoundData() instead because it returns more in-depth information.
   * @dev This does not error if no answer has been reached, it will simply return 0. Either wait to point to
   * an already answered Aggregator or use the recommended latestRoundData
   * instead which includes better verification information.
   */
  function latestTimestamp(
    address asset,
    address denomination
  )
    external
    view
    override
    checkAccess(asset, denomination)
    returns (
      uint256 timestamp
    )
  {
    AggregatorV2V3Interface aggregator = getFeed(asset, denomination);
    return aggregator.latestTimestamp();
  }

  /**
   * @notice get the latest completed round where the answer was updated
   * @param asset asset address
   * @param denomination denomination address
   * @dev overridden function to add the checkAccess() modifier
   *
   * @notice We advise to use latestRoundData() instead because it returns more in-depth information.
   * @dev Use latestRoundData instead. This does not error if no
   * answer has been reached, it will simply return 0. Either wait to point to
   * an already answered Aggregator or use the recommended latestRoundData
   * instead which includes better verification information.
   */
  function latestRound(
    address asset,
    address denomination
  )
    external
    view
    override
    checkAccess(asset, denomination)
    returns (
      uint256 roundId
    )
  {
    Phase memory currentPhase = getCurrentPhase(asset, denomination);
    return addPhase(currentPhase.id, uint64(currentPhase.aggregator.latestRound()));
  }

  /**
   * @notice get past rounds answers
   * @param asset asset address
   * @param denomination denomination address
   * @param roundId the proxy round id number to retrieve the answer for
   * @dev overridden function to add the checkAccess() modifier
   *
   * @notice We advise to use getRoundData() instead because it returns more in-depth information.
   * @dev This does not error if no answer has been reached, it will simply return 0. Either wait to point to
   * an already answered Aggregator or use the recommended getRoundData
   * instead which includes better verification information.
   */
  function getAnswer(
    address asset,
    address denomination,
    uint256 roundId
  )
    external
    view
    override
    checkAccess(asset, denomination)
    returns (
      int256 answer
    )
  {
    if (roundId > MAX_ID) return 0;
    (uint16 phaseId, uint64 aggregatorRoundId) = parseIds(roundId);
    AggregatorV2V3Interface aggregator = getPhaseFeed(asset, denomination, phaseId);
    if (address(aggregator) == address(0)) return 0;
    return aggregator.getAnswer(aggregatorRoundId);
  }

  /**
   * @notice get block timestamp when an answer was last updated
   * @param asset asset address
   * @param denomination denomination address
   * @param roundId the proxy round id number to retrieve the updated timestamp for
   * @dev overridden function to add the checkAccess() modifier
   *
   * @notice We advise to use getRoundData() instead because it returns more in-depth information.
   * @dev This does not error if no answer has been reached, it will simply return 0. Either wait to point to
   * an already answered Aggregator or use the recommended getRoundData
   * instead which includes better verification information.
   */
  function getTimestamp(
    address asset,
    address denomination,
    uint256 roundId
  )
    external
    view
    override
    checkAccess(asset, denomination)
    returns (
      uint256 timestamp
    )
  {
    if (roundId > MAX_ID) return 0;
    (uint16 phaseId, uint64 aggregatorRoundId) = parseIds(roundId);
    AggregatorV2V3Interface aggregator = getPhaseFeed(asset, denomination, phaseId);
    if (address(aggregator) == address(0)) return 0;
    return aggregator.getTimestamp(aggregatorRoundId);
  }

  /**
   * @notice represents the number of decimals the aggregator responses represent.
   */
  function decimals(
    address asset,
    address denomination
  )
    external
    view
    override
    returns (
      uint8
    )
  {
    AggregatorV2V3Interface aggregator = getFeed(asset, denomination);
    return aggregator.decimals();
  }

  /**
   * @notice returns the description of the aggregator the proxy points to.
   */
  function description(
    address asset,
    address denomination
  )
    external
    view
    override
    returns (
      string memory
    )
  {
    AggregatorV2V3Interface aggregator = getFeed(asset, denomination);
    return aggregator.description();
  }

  /**
   * @notice the version number representing the type of aggregator the proxy
   * points to.
   */
  function version(
    address asset,
    address denomination
  )
    external
    view
    override
    returns (
      uint256
    )
  {
    AggregatorV2V3Interface aggregator = getFeed(asset, denomination);
    return aggregator.version();
  }

  /**
   * @notice get data about the latest round. Consumers are encouraged to check
   * that they're receiving fresh data by inspecting the updatedAt and
   * answeredInRound return values.
   * Note that different underlying implementations of AggregatorV3Interface
   * have slightly different semantics for some of the return values. Consumers
   * should determine what implementations they expect to receive
   * data from and validate that they can properly handle return data from all
   * of them.
   * @param asset asset address
   * @param denomination denomination address
   * @return roundId is the round ID from the aggregator for which the data was
   * retrieved combined with a phase to ensure that round IDs get larger as
   * time moves forward.
   * @return answer is the answer for the given round
   * @return startedAt is the timestamp when the round was started.
   * (Only some AggregatorV3Interface implementations return meaningful values)
   * @return updatedAt is the timestamp when the round last was updated (i.e.
   * answer was last computed)
   * @return answeredInRound is the round ID of the round in which the answer
   * was computed.
   * (Only some AggregatorV3Interface implementations return meaningful values)
   * @dev Note that answer and updatedAt may change between queries.
   */
  function latestRoundData(
    address asset,
    address denomination
  )
    external
    view
    override
    checkAccess(asset, denomination)
    returns (
      uint80 roundId,
      int256 answer,
      uint256 startedAt,
      uint256 updatedAt,
      uint80 answeredInRound
    )
  {
    Phase memory currentPhase = getCurrentPhase(asset, denomination);
    (
      roundId,
      answer,
      startedAt,
      updatedAt,
      answeredInRound
    ) = currentPhase.aggregator.latestRoundData();
    return addPhaseIds(roundId, answer, startedAt, updatedAt, answeredInRound, currentPhase.id);
  }

  /**
   * @notice get data about a round. Consumers are encouraged to check
   * that they're receiving fresh data by inspecting the updatedAt and
   * answeredInRound return values.
   * Note that different underlying implementations of AggregatorV3Interface
   * have slightly different semantics for some of the return values. Consumers
   * should determine what implementations they expect to receive
   * data from and validate that they can properly handle return data from all
   * of them.
   * @param asset asset address
   * @param denomination denomination address
   * @param _roundId the proxy round id number to retrieve the round data for
   * @return roundId is the round ID from the aggregator for which the data was
   * retrieved combined with a phase to ensure that round IDs get larger as
   * time moves forward.
   * @return answer is the answer for the given round
   * @return startedAt is the timestamp when the round was started.
   * (Only some AggregatorV3Interface implementations return meaningful values)
   * @return updatedAt is the timestamp when the round last was updated (i.e.
   * answer was last computed)
   * @return answeredInRound is the round ID of the round in which the answer
   * was computed.
   * (Only some AggregatorV3Interface implementations return meaningful values)
   * @dev Note that answer and updatedAt may change between queries.
   */
  function getRoundData(
    address asset,
    address denomination,
    uint80 _roundId
  )
    external
    view
    override
    checkAccess(asset, denomination)
    returns (
      uint80 roundId,
      int256 answer,
      uint256 startedAt,
      uint256 updatedAt,
      uint80 answeredInRound
    )
  {
    (uint16 phaseId, uint64 aggregatorRoundId) = parseIds(_roundId);
    AggregatorV2V3Interface aggregator = getPhaseFeed(asset, denomination, phaseId);
    (
      roundId,
      answer,
      startedAt,
      updatedAt,
      answeredInRound
    ) = aggregator.getRoundData(aggregatorRoundId);
    return addPhaseIds(roundId, answer, startedAt, updatedAt, answeredInRound, phaseId);
  }

  /**
   * @notice Returns the proposed aggregator for an asset / denomination pair
   * @param asset asset address
   * @param denomination denomination address
   * @return proposedAggregator
  */
  function getProposedFeed(
    address asset,
    address denomination
  )
    external
    view
    override
    returns (
      AggregatorV2V3Interface proposedAggregator
    )
  {
    return s_proposedAggregators[asset][denomination];
  }

  /**
   * @notice Used if an aggregator contract has been proposed.
   * @param asset asset address
   * @param denomination denomination address
   * @param roundId the round ID to retrieve the round data for
   * @return id is the round ID for which data was retrieved
   * @return answer is the answer for the given round
   * @return startedAt is the timestamp when the round was started.
   * (Only some AggregatorV3Interface implementations return meaningful values)
   * @return updatedAt is the timestamp when the round last was updated (i.e.
   * answer was last computed)
   * @return answeredInRound is the round ID of the round in which the answer
   * was computed.
  */
  function proposedGetRoundData(
    address asset,
    address denomination,
    uint80 roundId
  )
    external
    view
    virtual
    override
    hasProposal(asset, denomination)
    returns (
      uint80 id,
      int256 answer,
      uint256 startedAt,
      uint256 updatedAt,
      uint80 answeredInRound
    )
  {
    return s_proposedAggregators[asset][denomination].getRoundData(roundId);
  }

  /**
   * @notice Used if an aggregator contract has been proposed.
   * @param asset asset address
   * @param denomination denomination address
   * @return id is the round ID for which data was retrieved
   * @return answer is the answer for the given round
   * @return startedAt is the timestamp when the round was started.
   * (Only some AggregatorV3Interface implementations return meaningful values)
   * @return updatedAt is the timestamp when the round last was updated (i.e.
   * answer was last computed)
   * @return answeredInRound is the round ID of the round in which the answer
   * was computed.
  */
  function proposedLatestRoundData(
    address asset,
    address denomination
  )
    external
    view
    virtual
    override
    hasProposal(asset, denomination)
    returns (
      uint80 id,
      int256 answer,
      uint256 startedAt,
      uint256 updatedAt,
      uint80 answeredInRound
    )
  {
    return s_proposedAggregators[asset][denomination].latestRoundData();
  }

  function addPhase(
    uint16 phase,
    uint64 originalId
  )
    internal
    pure
    returns (
      uint80
    )
  {
    return uint80(uint256(phase) << PHASE_OFFSET | originalId);
  }

  function parseIds(
    uint256 roundId
  )
    internal
    pure
    returns (
      uint16,
      uint64
    )
  {
    uint16 phaseId = uint16(roundId >> PHASE_OFFSET);
    uint64 aggregatorRoundId = uint64(roundId);

    return (phaseId, aggregatorRoundId);
  }

  function addPhaseIds(
      uint80 roundId,
      int256 answer,
      uint256 startedAt,
      uint256 updatedAt,
      uint80 answeredInRound,
      uint16 phaseId
  )
    internal
    pure
    returns (
      uint80,
      int256,
      uint256,
      uint256,
      uint80
    )
  {
    return (
      addPhase(phaseId, uint64(roundId)),
      answer,
      startedAt,
      updatedAt,
      addPhase(phaseId, uint64(answeredInRound))
    );
  }

  function _setFeed(
    address asset,
    address denomination,
    address newAggregator
  )
    internal
    returns (
      uint16 nextPhaseId,
      address previousAggregator
    )
  {
    AggregatorV2V3Interface currentAggregator = getFeed(asset, denomination);
    Phase memory currentPhase = getCurrentPhase(asset, denomination);
    delete s_proposedAggregators[asset][denomination];
    nextPhaseId = currentPhase.id + 1;
    s_currentPhaseId[asset][denomination] = nextPhaseId;

    uint80 previousAggregatorEndingRoundId = _getLatestAggregatorRoundId(currentAggregator);
    s_phases[asset][denomination][currentPhase.id].endingAggregatorRoundId = previousAggregatorEndingRoundId;
    uint80 startingRoundId = _getLatestAggregatorRoundId(AggregatorV2V3Interface(newAggregator));
    s_phases[asset][denomination][nextPhaseId] = Phase(nextPhaseId, AggregatorV2V3Interface(newAggregator), startingRoundId, 0);

    return (nextPhaseId, address(currentAggregator));
  }

  function _getPreviousRoundId(
    address asset,
    address denomination,
    uint16 phaseId,
    uint80 roundId
  )
    internal
    view
    returns (
      uint80
    )
  {
    for (uint16 pid = phaseId; pid > 0; pid--) {
      Phase memory phase = _getPhase(asset, denomination, pid);
      (uint80 startingRoundId, uint80 endingRoundId) = _getRoundRange(phase);
      if (address(phase.aggregator) == address(0)) continue;
      if (roundId <= startingRoundId) continue;
      if (roundId > startingRoundId && roundId <= endingRoundId) return roundId - 1;
      if (roundId > endingRoundId) return endingRoundId;
    }
    return 0; // Round not found
  }

  function _getNextRoundId(
    address asset,
    address denomination,
    uint16 phaseId,
    uint80 roundId
  )
    internal
    view
    returns (
      uint80
    )
  {
    Phase memory currentPhase = getCurrentPhase(asset, denomination);
    for (uint16 pid = phaseId; pid <= currentPhase.id; pid++) {
      Phase memory phase = _getPhase(asset, denomination, pid);
      (uint80 startingRoundId, uint80 endingRoundId) = (pid == currentPhase.id) ? _getLatestRoundRange(phase) : _getRoundRange(phase);
      if (address(phase.aggregator) == address(0)) continue;
      if (roundId >= endingRoundId) continue;
      if (roundId >= startingRoundId && roundId < endingRoundId) return roundId + 1;
      if (roundId < startingRoundId) return startingRoundId;
    }
    return 0; // Round not found
  }

  function _getRoundRange(
    Phase memory phase
  )
    internal
    pure
    returns (
      uint80 startingRoundId,
      uint80 endingRoundId
    )
  {
    return (
      _getStartingRoundId(phase),
      _getEndingRoundId(phase)
    );
  }

  function _getLatestRoundRange(
    Phase memory currentPhase
  )
    internal
    view
    returns (
      uint80 startingRoundId,
      uint80 endingRoundId
    )
  {
    return (
      _getStartingRoundId(currentPhase),
      _getLatestRoundId(currentPhase)
    );
  }

  function _getStartingRoundId(
    Phase memory phase
  )
    internal
    pure
    returns (
      uint80 startingRoundId
    )
  {
    return addPhase(phase.id, uint64(phase.startingAggregatorRoundId));
  }

  function _getEndingRoundId(
    Phase memory phase
  )
    internal
    pure
    returns (
      uint80 startingRoundId
    )
  {
    return addPhase(phase.id, uint64(phase.endingAggregatorRoundId));
  }

  function _getLatestRoundId(
    Phase memory currentPhase
  )
    internal
    view
    returns (
      uint80 startingRoundId
    )
  {
    uint80 latestAggregatorRoundId = _getLatestAggregatorRoundId(currentPhase.aggregator);
    return addPhase(currentPhase.id, uint64(latestAggregatorRoundId));
  }

  function _getLatestAggregatorRoundId(
    AggregatorV2V3Interface aggregator
  )
    internal
    view
    returns (
      uint80 roundId
    )
  {
    if (address(aggregator) == address(0)) return uint80(0);
    return uint80(aggregator.latestRound());
  }

  function _getPhase(
    address asset,
    address denomination,
    uint16 phaseId
  )
    internal
    view
    returns (
      Phase memory phase
    )
  {
    return s_phases[asset][denomination][phaseId];
  }

  function _getPhaseByRound(
    address asset,
    address denomination,
    uint80 roundId
  )
    internal
    view
    returns (
      Phase memory
    )
  {
    // Handle case where the round is in current phase
    Phase memory currentPhase = getCurrentPhase(asset, denomination);
    (uint80 startingCurrentRoundId, uint80 endingCurrentRoundId) = _getLatestRoundRange(currentPhase);
    if (roundId >= startingCurrentRoundId && roundId <= endingCurrentRoundId) return currentPhase;

    // Handle case where the round is in past phases
    for (uint16 phaseId = currentPhase.id - 1; phaseId > 0; phaseId--) {
      Phase memory phase = s_phases[asset][denomination][phaseId];
      if (address(phase.aggregator) == address(0)) continue;
      (uint80 startingRoundId, uint80 endingRoundId) = _getRoundRange(phase);
      if (roundId >= startingRoundId && roundId <= endingRoundId) return phase;
      if (roundId > endingRoundId) break;
    }
    return s_phases[asset][denomination][0];
  }

  /**
   * @dev reverts if the caller does not have access by the accessController
   * contract to the aggregator or is the contract itself.
   */
  modifier checkAccess(
    address asset,
    address denomination
  ) {
    bytes memory callData = abi.encode(asset, denomination, msg.data);
    require(address(s_accessController) == address(0) || s_accessController.hasAccess(msg.sender, callData), "No access");
    _;
  }

  /**
   * @dev reverts if no proposed aggregator was set
   */
  modifier hasProposal(
    address asset,
    address denomination
  ) {
    require(address(s_proposedAggregators[asset][denomination]) != address(0), "No proposed aggregator present");
    _;
  }
}
