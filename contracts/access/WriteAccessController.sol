// SPDX-License-Identifier: MIT

pragma solidity 0.7.6;

import "../vendor/Owned.sol";
import "../interfaces/AccessControllerInterface.sol";

/**
 * @title WriteAccessController
 * @dev does not make any special permissions for EOAs, see
 * ReadAccessController for that.
 */
contract WriteAccessController is AccessControllerInterface, Owned {
  bool public checkEnabled;
  mapping(address => bool) internal s_globalAccessList;
  mapping(address => mapping(bytes => bool)) internal s_accessList;

  event AccessAdded(address user, bytes data);
  event AccessRemoved(address user, bytes data);
  event CheckAccessEnabled();
  event CheckAccessDisabled();

  constructor()
  {
    checkEnabled = true;
  }

  /**
   * @notice Returns the access of an address
   * @param user The address to query
   * @param data The calldata to query
   */
  function hasAccess(
    address user,
    bytes memory data
  )
    public
    view
    virtual
    override
    returns (bool)
  {
    return s_globalAccessList[user] || s_accessList[user][data] || !checkEnabled;
  }

  /**
   * @notice Adds an address to the access list
   * @param user The address to add
   * @param data The calldata to add
   */
  function addAccess(
    address user,
    bytes memory data
  )
    external
    onlyOwner()
  {
    if (data.length == 0 && !s_globalAccessList[user]) {
      s_globalAccessList[user] = true;
      emit AccessAdded(user, data);
    }
    if (data.length != 0 && !s_accessList[user][data]) {
      s_accessList[user][data] = true;
      emit AccessAdded(user, data);
    }
  }

  /**
   * @notice Removes an address from the access list
   * @param user The address to remove
   * @param data The calldata to remove
   */
  function removeAccess(
    address user,
    bytes memory data
  )
    external
    onlyOwner()
  {
    if (data.length == 0 && s_globalAccessList[user]) {
      s_globalAccessList[user] = false;
      emit AccessRemoved(user, data);
    }
    if (data.length != 0 && s_accessList[user][data]) {
      s_accessList[user][data] = false;
      emit AccessRemoved(user, data);
    }
  }

  /**
   * @notice makes the access check enforced
   */
  function enableAccessCheck()
    external
    onlyOwner()
  {
    if (!checkEnabled) {
      checkEnabled = true;
      emit CheckAccessEnabled();
    }
  }

  /**
   * @notice makes the access check unenforced
   */
  function disableAccessCheck()
    external
    onlyOwner()
  {
    if (checkEnabled) {
      checkEnabled = false;
      emit CheckAccessDisabled();
    }
  }

  /**
   * @dev reverts if the caller does not have access
   */
  modifier checkAccess() {
    require(hasAccess(msg.sender, msg.data), "No access");
    _;
  }
}