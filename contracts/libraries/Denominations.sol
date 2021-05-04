// SPDX-License-Identifier: MIT

pragma solidity ^0.7.0;

library Denominations {
  address public constant ETH = 0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE;
  address public constant BTC = 0xbBbBBBBbbBBBbbbBbbBbbbbBBbBbbbbBbBbbBBbB;

  // Fiat currencies are identified by the Unicode of their currency symbol
  address public constant USD = 0x0000000000000000000000000000000000000024;
  address public constant GBP = 0x00000000000000000000000000000000000000A3;
  address public constant JPY = 0x00000000000000000000000000000000000000A5;
  address public constant EUR = 0x00000000000000000000000000000000000020Ac;
  // ...
}
