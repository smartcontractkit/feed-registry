// SPDX-License-Identifier: MIT

pragma solidity ^0.7.0;

library Denominations {
  address public constant ETH = 0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE;
  address public constant BTC = 0xbBbBBBBbbBBBbbbBbbBbbbbBBbBbbbbBbBbbBBbB;

  // Fiat currencies follow https://en.wikipedia.org/wiki/ISO_4217
  address public constant USD = 0x0000000000000000000000000000000000000840;
  address public constant GBP = 0x0000000000000000000000000000000000000826;
  address public constant EUR = 0x0000000000000000000000000000000000000978;
  address public constant JPY = 0x0000000000000000000000000000000000000392;
  address public constant KRW = 0x0000000000000000000000000000000000000410;
  address public constant CNY = 0x0000000000000000000000000000000000000156;
  address public constant AUD = 0x0000000000000000000000000000000000000036;
  address public constant CAD = 0x0000000000000000000000000000000000000124;
  address public constant CHF = 0x0000000000000000000000000000000000000756;
  address public constant ARS = 0x0000000000000000000000000000000000000032;
}
