// SPDX-License-Identifier: MIT

pragma solidity 0.7.6;

import "../interfaces/IFeedRegistry.sol";

contract MockConsumer {
  IFeedRegistry private s_FeedRegistry;

  constructor(
    IFeedRegistry FeedRegistry
  ) {
    s_FeedRegistry = FeedRegistry;
  }

  function getFeedRegistry()
    public
    view
    returns (
      IFeedRegistry
    )
  {
    return s_FeedRegistry;
  }

  function read(
    address asset,
    address denomination
  )
    public
    view
    returns (
      int256
    )
  {
    return s_FeedRegistry.latestAnswer(asset, denomination);
  }
}
