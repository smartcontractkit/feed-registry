// SPDX-License-Identifier: MIT

pragma solidity 0.7.6;

import "./AccessControllerInterface.sol";

interface IAccessControlled {
  event AccessControllerSet(
    address indexed accessController
  );

  function setController(
    AccessControllerInterface _accessController
  )
    external;

  function getController() 
    external
    view
    returns (
      AccessControllerInterface
    );
}