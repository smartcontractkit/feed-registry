// SPDX-License-Identifier: MIT

pragma solidity 0.7.6;

import "../interfaces/AccessControlledInterface.sol";
import "../vendor/AccessControllerInterface.sol";
import "../vendor/ConfirmedOwner.sol";

contract AccessControlled is AccessControlledInterface, ConfirmedOwner(msg.sender) {
  AccessControllerInterface internal s_accessController;

  function setController(
    AccessControllerInterface _accessController
  )
    public
    override
    onlyOwner()
  {
    s_accessController = _accessController;
    emit AccessControllerSet(address(_accessController));
  }

  function getController()
    public
    view
    override
    returns (
      AccessControllerInterface
    )
  {
    return s_accessController;
  }
}
