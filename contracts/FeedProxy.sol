// SPDX-License-Identifier: MIT

pragma solidity 0.7.6;
pragma abicoder v2;

import "@chainlink/contracts/src/v0.7/interfaces/AggregatorV2V3Interface.sol";
import "./access/AccessControlled.sol";
import "./interfaces/IFeedProxy.sol";
import "./vendor/Address.sol";

import "hardhat/console.sol";

contract FeedProxy is IFeedProxy, AccessControlled {
  using Address for address;

  uint256 constant private PHASE_OFFSET = 64;
  uint256 constant private PHASE_SIZE = 16;
  uint256 constant private MAX_ID = 2**(PHASE_OFFSET+PHASE_SIZE) - 1;    

  mapping(AggregatorV2V3Interface => bool) private s_isFeedEnabled;
  mapping(address => mapping(bytes32 => AggregatorV2V3Interface)) private s_proposedFeeds; // AggregatorProxyInterface ?
  mapping(address => mapping(bytes32 => mapping(uint16 => AggregatorV2V3Interface))) private s_phaseFeeds; // AggregatorProxyInterface ?
  mapping(address => mapping(bytes32 => Phase)) private s_currentPhase;

  function getCurrentPhase(
    address asset,
    bytes32 denomination
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

  function getPhaseId(
    address asset,
    bytes32 denomination
  )
    public
    view
    override
    returns (
      uint16
    )
  {
    return getCurrentPhase(asset, denomination).id;
  }  

  /**
   * @notice retrieve the feed of an asset / denomination pair in the current phase
   */
  function getFeed(
    address asset,
    bytes32 denomination
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

  function getPhaseFeed(
    address asset,
    bytes32 denomination,
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

  function proposeFeed(
    address asset,
    bytes32 denomination,
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

  function confirmFeed(
    address asset,
    bytes32 denomination,
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
    bytes32 denomination,
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
   * @notice retrieve the latest answer of a feed, given an asset / denomination pair
   * or reverts if feed is either unset or has not granted access
   */
  function latestAnswer(
    address asset, 
    bytes32 denomination
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

  function latestTimestamp(
    address asset, 
    bytes32 denomination
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

  function latestRound(
    address asset,
    bytes32 denomination
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

  function getAnswer(
    address asset,
    bytes32 denomination,
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
    AggregatorV2V3Interface feed = getFeed(asset, denomination);
    if (address(feed) == address(0)) return 0;

    return feed.getAnswer(aggregatorRoundId);
  }

  function getTimestamp(
    address asset,
    bytes32 denomination,
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
    AggregatorV2V3Interface feed = getFeed(asset, denomination);
    if (address(feed) == address(0)) return 0;
    
    return feed.getTimestamp(roundId);
  }

  function decimals(
    address asset,
    bytes32 denomination
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
  
  function description(
    address asset,
    bytes32 denomination
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
    
  function version(
    address asset,
    bytes32 denomination
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

  function latestRoundData(
    address asset,
    bytes32 denomination
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

  function getRoundData(
    address asset,
    bytes32 denomination,  
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
    bytes32 denomination
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
   * @param denomination denomination identifier: keccak256("USD")
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
    bytes32 denomination,
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
   * @param denomination denomination identifier: keccak256("USD")
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
    bytes32 denomination
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

  modifier checkAccess(
    address asset,
    bytes32 denomination
  ) {
    bytes memory callData = abi.encode(asset, denomination, msg.data); // Includes asset pair (TKN / USD) in payload to access controller
    require(address(s_accessController) == address(0) || s_accessController.hasAccess(msg.sender, callData), "No access");
    _;
  }

  modifier hasProposal(
    address asset,
    bytes32 denomination
  ) {
    require(address(s_proposedFeeds[asset][denomination]) != address(0), "No proposed feed present");
    _;
  }
}