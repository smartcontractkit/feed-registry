// SPDX-License-Identifier: MIT

pragma solidity 0.7.6;

import "../interfaces/IFeedProxy.sol";

contract MockFeedProxyConsumer {
  IFeedProxy private s_feedProxy;

  address public immutable ASSET = 0x0000000000000000000000000000000000000001;
  bytes32 public immutable DENOMINATION = keccak256("USD");

  constructor(
    IFeedProxy feedProxy
  ) {
    require(address(feedProxy) != address(0), "Invalid feedProxy address");
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

  function read() 
    public 
    view 
    returns (
      int256
    ) 
  {
    return s_feedProxy.latestAnswer(ASSET, DENOMINATION);
  }
}
