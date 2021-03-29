// SPDX-License-Identifier: MIT

pragma solidity 0.7.6;

import "./ReadAccessController.sol";

/**
 * @title FeedProxyAccessController
 * @notice Extends ReadAccessController, and checks the (asset, denomination) values of msg.data.
 */
contract FeedProxyAccessController is ReadAccessController {

  /**
   * @notice Returns the access of an address to an asset/denomination pair
   * @param account The address to query
   * @param data The calldata to query
   */
  function hasAccess(
    address account,
    bytes memory data
  )
    public
    view
    virtual
    override
    returns (bool)
  {
    (
      address asset,
      bytes32 denomination,
      // bytes msg.data
    ) = abi.decode(data, (address, bytes32, bytes));
    bytes memory pairData = abi.encode(asset, denomination); // Parse only asset pair (TKN / USD)
    return super.hasAccess(account, pairData) || account == tx.origin; // solhint-disable-line
  }
}