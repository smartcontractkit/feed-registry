// SPDX-License-Identifier: MIT

pragma solidity 0.7.6;

import "../interfaces/IFeedProxy.sol";

contract MockConsumer {
  IFeedProxy private s_feedProxy;

  constructor(
    IFeedProxy feedProxy
  ) {
    s_feedProxy = feedProxy;
  }

  function getFeedProxy()
    public
    view
    returns (
      IFeedProxy
    )
  {
    return s_feedProxy;
  }

  function read(
    address asset,
    bytes32 denomination
  ) 
    public 
    view 
    returns (
      int256
    ) 
  {
    return s_feedProxy.latestAnswer(asset, denomination);
  }
}
