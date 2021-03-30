// SPDX-License-Identifier: MIT

pragma solidity 0.7.6;

import "../interfaces/AccessControllerInterface.sol";
import "../interfaces/IAccessControlled.sol";
import "../vendor/Owned.sol";

contract AccessControlled is IAccessControlled, Owned {
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
