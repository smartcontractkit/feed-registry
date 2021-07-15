// SPDX-License-Identifier: MIT
pragma solidity ^0.7.0;

import "../libraries/Denominations.sol";

contract MockDenominator {
    function getETH()
      public
      pure
      returns (
        address
      ) {
        return Denominations.ETH;
    }

    function getBTC()
      public
      pure
      returns (
        address
      ) {
        return Denominations.BTC;
    }

    function getUSD()
      public
      pure
      returns (
        address
      )
    {
        return Denominations.USD;
    }

    function getGBP()
      public
      pure
      returns (
        address
      )
    {
        return Denominations.GBP;
    }

    function getEUR()
      public
      pure
      returns (
        address
      )
    {
        return Denominations.EUR;
    }

    function getAUD()
      public
      pure
      returns (
        address
      )
    {
        return Denominations.AUD;
    }
}
