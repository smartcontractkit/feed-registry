// SPDX-License-Identifier: MIT

pragma solidity 0.7.6;
pragma abicoder v2; // solhint-disable compiler-version

import "@chainlink/contracts/src/v0.7/interfaces/AggregatorV2V3Interface.sol";
import "./access/AccessControlled.sol";
import "./interfaces/IFeedProxy.sol";
import "./vendor/Address.sol";
import "./libraries/Denominations.sol";

/**
  * @notice A trusted proxy for updating where current answers are read from
  * @notice This contract provides a consistent address for consumers but delegates where it reads from to the owner, who is
  * trusted to update it. This proxy contract works for multiple feeds, not just a single feed.
  * @notice Only access enabled addresses are allowed to access getters for
  * aggregated answers and round information
  */
contract FeedProxy is IFeedProxy, AccessControlled {
  using Address for address;

  uint256 constant private PHASE_OFFSET = 64;
  uint256 constant private PHASE_SIZE = 16;
  uint256 constant private MAX_ID = 2**(PHASE_OFFSET+PHASE_SIZE) - 1;

  mapping(AggregatorV2V3Interface => bool) private s_isFeedEnabled;
  mapping(address => mapping(uint256 => AggregatorV2V3Interface)) private s_proposedFeeds;
  mapping(address => mapping(uint256 => mapping(uint16 => AggregatorV2V3Interface))) private s_phaseFeeds;
  mapping(address => mapping(uint256 => Phase)) private s_currentPhase;

  /**
   * @notice returns a feed's current phase
   * @param asset asset address
   * @param denomination denomination identifier
   * @return currentPhase is the feed's current phase
   */
  function getCurrentPhase(
    address asset,
    uint256 denomination
  )
    public
    view
    override
    returns (
      Phase memory currentPhase
    )
  {
    return s_currentPhase[asset][denomination];
  }

  /**
   * @notice retrieve the feed of an asset / denomination pair in the current phase
   * @param asset asset address
   * @param denomination denomination identifier
   */
  function getFeed(
    address asset,
    uint256 denomination
  )
    public
    view
    override
    returns (
      AggregatorV2V3Interface feed
    )
  {
    Phase memory currentPhase = getCurrentPhase(asset, denomination);
    return currentPhase.feed;
  }

  /**
   * @notice retrieve the feed of an asset / denomination pair of a phase
   * @param asset asset address
   * @param denomination denomination identifier
   * @param phaseId phase ID
   */
  function getPhaseFeed(
    address asset,
    uint256 denomination,
    uint16 phaseId
  )
    public
    view
    override
    returns (
      AggregatorV2V3Interface feed
    )
  {
    return s_phaseFeeds[asset][denomination][phaseId];
  }

  /**
   * @notice returns true if a feed is enabled for any pair
   * @param feed feed address
   */
  function isFeedEnabled(
    AggregatorV2V3Interface feed
  )
    public
    view
    override
    returns (
      bool
    )
  {
    return s_isFeedEnabled[feed];
  }

  /**
   * @notice Allows the owner to propose a new address for the aggregator
   * @param asset asset address
   * @param denomination denomination identifier
   * @param feedAddress The new aggregator contract address
   */
  function proposeFeed(
    address asset,
    uint256 denomination,
    address feedAddress
  )
    external
    override
    onlyOwner()
  {
    Phase memory currentPhase = getCurrentPhase(asset, denomination);
    s_proposedFeeds[asset][denomination] = AggregatorV2V3Interface(feedAddress);
    emit FeedProposed(asset, denomination, address(currentPhase.feed), feedAddress);
  }

  /**
   * @notice Allows the owner to confirm and change the address
   * to the proposed aggregator
   * @dev Reverts if the given address doesn't match what was previously
   * proposed
   * @param asset asset address
   * @param denomination denomination identifier
   * @param feedAddress The new aggregator contract address
   */
  function confirmFeed(
    address asset,
    uint256 denomination,
    address feedAddress
  )
    external
    override
    onlyOwner()
  {
    require(feedAddress == address(s_proposedFeeds[asset][denomination]), "Invalid proposed feed");
    AggregatorV2V3Interface previousFeed = getFeed(asset, denomination);
    delete s_proposedFeeds[asset][denomination];
    _setFeed(asset, denomination, feedAddress);
    s_isFeedEnabled[AggregatorV2V3Interface(feedAddress)] = true;
    s_isFeedEnabled[previousFeed] = false;
    emit FeedConfirmed(asset, denomination, address(previousFeed), feedAddress);
  }

  function _setFeed(
    address asset,
    uint256 denomination,
    address feedAddress
  )
    internal
  {
    Phase memory currentPhase = getCurrentPhase(asset, denomination);
    uint16 nextPhaseId = currentPhase.id + 1;
    s_currentPhase[asset][denomination] = Phase(nextPhaseId, AggregatorV2V3Interface(feedAddress));
    s_phaseFeeds[asset][denomination][nextPhaseId] = AggregatorV2V3Interface(feedAddress);
  }

  /**
   * @notice Reads the current answer for an asset / denomination pair's aggregator.
   * @param asset asset address
   * @param denomination denomination identifier
   * @dev #[deprecated] Use latestRoundData instead. This does not error if no
   * answer has been reached, it will simply return 0. Either wait to point to
   * an already answered Aggregator or use the recommended latestRoundData
   * instead which includes better verification information.
   */
  function latestAnswer(
    address asset,
    uint256 denomination
  )
    external
    view
    override
    checkAccess(asset, denomination)
    returns (int256 answer)
  {
    AggregatorV2V3Interface feed = getFeed(asset, denomination);
    return feed.latestAnswer();
  }

  /**
   * @notice get the latest completed round where the answer was updated. This
   * @param asset asset address
   * @param denomination denomination identifier
   * ID includes the proxy's phase, to make sure round IDs increase even when
   * switching to a newly deployed aggregator.
   *
   * @dev #[deprecated] Use latestRoundData instead. This does not error if no
   * answer has been reached, it will simply return 0. Either wait to point to
   * an already answered Aggregator or use the recommended latestRoundData
   * instead which includes better verification information.
   */
  function latestTimestamp(
    address asset,
    uint256 denomination
  )
    external
    view
    override
    checkAccess(asset, denomination)
    returns (uint256 timestamp)
  {
    AggregatorV2V3Interface feed = getFeed(asset, denomination);
    return feed.latestTimestamp();
  }

  /**
   * @notice get the latest completed round where the answer was updated
   * @param asset asset address
   * @param denomination denomination identifier
   * @dev overridden function to add the checkAccess() modifier
   *
   * @dev #[deprecated] Use latestRoundData instead. This does not error if no
   * answer has been reached, it will simply return 0. Either wait to point to
   * an already answered Aggregator or use the recommended latestRoundData
   * instead which includes better verification information.
   */
  function latestRound(
    address asset,
    uint256 denomination
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
    return addPhase(currentPhase.id, uint64(currentPhase.feed.latestRound()));
  }

  /**
   * @notice get past rounds answers
   * @param asset asset address
   * @param denomination denomination identifier
   * @param roundId the answer number to retrieve the answer for
   * @dev overridden function to add the checkAccess() modifier
   *
   * @dev #[deprecated] Use getRoundData instead. This does not error if no
   * answer has been reached, it will simply return 0. Either wait to point to
   * an already answered Aggregator or use the recommended getRoundData
   * instead which includes better verification information.
   */
  function getAnswer(
    address asset,
    uint256 denomination,
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
    AggregatorV2V3Interface feed = getPhaseFeed(asset, denomination, phaseId);
    if (address(feed) == address(0)) return 0;

    return feed.getAnswer(aggregatorRoundId);
  }

  /**
   * @notice get block timestamp when an answer was last updated
   * @param asset asset address
   * @param denomination denomination identifier
   * @param roundId the answer number to retrieve the updated timestamp for
   * @dev overridden function to add the checkAccess() modifier
   *
   * @dev #[deprecated] Use getRoundData instead. This does not error if no
   * answer has been reached, it will simply return 0. Either wait to point to
   * an already answered Aggregator or use the recommended getRoundData
   * instead which includes better verification information.
   */
  function getTimestamp(
    address asset,
    uint256 denomination,
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
    AggregatorV2V3Interface feed = getPhaseFeed(asset, denomination, phaseId);
    if (address(feed) == address(0)) return 0;

    return feed.getTimestamp(aggregatorRoundId);
  }

  /**
   * @notice represents the number of decimals the aggregator responses represent.
   */
  function decimals(
    address asset,
    uint256 denomination
  )
    external
    view
    override
    returns (
      uint8
    )
  {
    AggregatorV2V3Interface feed = getFeed(asset, denomination);
    return feed.decimals();
  }

  /**
   * @notice returns the description of the aggregator the proxy points to.
   */
  function description(
    address asset,
    uint256 denomination
  )
    external
    view
    override
    returns (
      string memory
    )
  {
    AggregatorV2V3Interface feed = getFeed(asset, denomination);
    return feed.description();
  }

  /**
   * @notice the version number representing the type of aggregator the proxy
   * points to.
   */
  function version(
    address asset,
    uint256 denomination
  )
    external
    view
    override
    returns (
      uint256
    )
  {
    AggregatorV2V3Interface feed = getFeed(asset, denomination);
    return feed.version();
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
   * @param denomination denomination identifier
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
    uint256 denomination
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
    AggregatorV2V3Interface feed = getFeed(asset, denomination);
    return feed.latestRoundData();
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
   * @param denomination denomination identifier
   * @param _roundId the round ID to retrieve the round data for
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
    uint256 denomination,
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
    AggregatorV2V3Interface feed = getFeed(asset, denomination);
    return feed.getRoundData(_roundId);
  }

  function getProposedFeed(
    address asset,
    uint256 denomination
  )
    external
    view
    override
    returns (
      AggregatorV2V3Interface proposedFeed
    )
  {
    return s_proposedFeeds[asset][denomination];
  }

  /**
   * @notice Used if an aggregator contract has been proposed.
   * @param asset asset address
   * @param denomination denomination identifier
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
    uint256 denomination,
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
    return s_proposedFeeds[asset][denomination].getRoundData(roundId);
  }

  /**
   * @notice Used if an aggregator contract has been proposed.
   * @param asset asset address
   * @param denomination denomination identifier
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
    uint256 denomination
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
    return s_proposedFeeds[asset][denomination].latestRoundData();
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

  /**
   * @dev reverts if the caller does not have access by the accessController
   * contract to the feed or is the contract itself.
   */
  modifier checkAccess(
    address asset,
    uint256 denomination
  ) {
    bytes memory callData = abi.encode(asset, denomination, msg.data); // Send feed idenfitier (TKN / USD) to access controller
    require(address(s_accessController) == address(0) || s_accessController.hasAccess(msg.sender, callData), "No access");
    _;
  }

  /**
   * @dev reverts if no proposed feed was set
   */
  modifier hasProposal(
    address asset,
    uint256 denomination
  ) {
    require(address(s_proposedFeeds[asset][denomination]) != address(0), "No proposed feed present");
    _;
  }
}
