// SPDX-License-Identifier: MIT

pragma solidity 0.7.6;

import "../vendor/AccessControllerInterface.sol";
import "../vendor/Owned.sol";

/**
 * @title WriteAccessController
 * @notice Has two access lists: a global list and a data-specific list.
 * @dev does not make any special permissions for EOAs, see
 * ReadAccessController for that.
 */
contract WriteAccessController is AccessControllerInterface, Owned {
  bool public checkEnabled = true;
  mapping(address => bool) internal s_globalAccessList;
  mapping(address => mapping(bytes => bool)) internal s_localAccessList;

  event AccessAdded(address user, bytes data);
  event AccessRemoved(address user, bytes data);
  event CheckAccessEnabled();
  event CheckAccessDisabled();

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
    return s_globalAccessList[user] || s_localAccessList[user][data] || !checkEnabled;
  }

/**
   * @notice Adds an address to the global access list
   * @param user The address to add
   */
  function addGlobalAccess(
    address user
  )
    external
    onlyOwner()
  {
    if (!s_globalAccessList[user]) {
      _addGlobalAccess(user);
    }
  }

  /**
   * @notice Adds an address+data to the local access list
   * @param user The address to add
   * @param data The calldata to add
   */
  function addLocalAccess(
    address user,
    bytes memory data
  )
    external
    onlyOwner()
  {
    if (!s_localAccessList[user][data]) {
      _addLocalAccess(user, data);
    }
  }

  /**
   * @notice Removes an address from the global access list
   * @param user The address to remove
   */
  function removeGlobalAccess(
    address user
  )
    external
    onlyOwner()
  {
    if (s_globalAccessList[user]) {
      _removeGlobalAccess(user);
    }
  }

  /**
   * @notice Removes an address+data from the local access list
   * @param user The address to remove
   * @param data The calldata to remove
   */
  function removeLocalAccess(
    address user,
    bytes memory data
  )
    external
    onlyOwner()
  {
    if (s_localAccessList[user][data]) {
      _removeLocalAccess(user, data);
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
    if (checkEnabled) {
      require(hasAccess(msg.sender, msg.data), "No access");
    }
    _;
  }

  function _addGlobalAccess(address user) internal {
    s_globalAccessList[user] = true;
    emit AccessAdded(user, "");
  }

  function _removeGlobalAccess(address user) internal {
    s_globalAccessList[user] = false;
    emit AccessRemoved(user, "");
  }

  function _addLocalAccess(address user, bytes memory data) internal {
    s_localAccessList[user][data] = true;
    emit AccessAdded(user, data);
  }

  function _removeLocalAccess(address user, bytes memory data) internal {
    s_localAccessList[user][data] = false;
    emit AccessRemoved(user, data);
  }
}
