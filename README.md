# Chainlink Feed Registry

The Feed Registry is an on-chain mapping of assets to feeds. It allows users and DeFi protocols to query Chainlink price feeds, given pair of asset and denomination addresses.

## Background

DeFi protocols that use Chainlink often implement their own on-chain registry of token addresses to Chainlink feeds. Examples include [Yearn](https://github.com/yearn/audit/blob/4b07283c80fc005e899afa8b5fb2bb949fe11f28/contracts/ySwap/ChainLinkFeedsRegistry.sol), [Aave](https://github.com/aave/protocol-v2/blob/2708551bcf3afb28ee9798ccf7f3027ea0ecec10/contracts/misc/AaveOracle.sol#L25), [dydx](https://github.com/dydxprotocol/perpetual/blob/master/contracts/protocol/v1/PerpetualV1.sol#L59-L60), [Alpha Homora](https://github.com/AlphaFinanceLab/alphahomora-bsc/blob/master/contracts/5/PriceOracle.sol#L1-L10), [Alpha Homora](https://github.com/AlphaFinanceLab/alphahomora-bsc/blob/master/contracts/5/PriceOracle.sol#L1-L10).

To speed up integration and ensure that protocols use the correct feeds, the Feed Registry provides a canonical on-chain registry of assets to feeds.

## Architecture

![Feed Registry Architecture](https://user-images.githubusercontent.com/1084226/114042612-29f10d80-98b8-11eb-9868-5be7de01ea68.png)

The Feed Registry consists of the following contracts:

- `FeedRegistry` is an on-chain mapping of `(address base, address quote)` pairs to Chainlink aggregator contracts.
- `PairReadAccessController` is an access controller contract to allowlist specific contracts from reading the feed registry.
- `Denominations` is an external library contract containing base and quote identifiers for assets that do not have a canonical Ethereum address.

## Feed Registry price feed getters

The `FeedRegistry` implements a similar interface as the [`AggregatorProxy`](https://github.com/smartcontractkit/chainlink/blob/develop/evm-contracts/src/v0.6/AggregatorProxy.sol) contract, except it takes in two additional inputs: `base` and `quote`.

```solidity
interface FeedRegistryInterface {

  function latestAnswer(
    address base,
    address quote
  )
    external
    view
    returns (
      int256 answer
    );

  ... other getters
}
```

The `address` type is used for `base` and `quote` after gathering feedback from multiple users. These `base` and `quote` address represent a specific pair. For example, to query the LINK / USD feed, you call:

```solidity
latestAnswer(address base, address quote)
```

by supplying an `base` and `quote` parameter, with the LINK token address and the `Denominations.USD` address respectively.

## Feed Registry price feed management

The `FeedRegistry` contract has the following setters to add / update / remove feeds to / from the registry:

- `proposeFeed()`
- `confirmFeed()`

These functions follow the same 2-step design that exists in other Chainlink contracts, such as `AggregatorProxy` and `ConfirmedOwner`.

## Feed Registry round helpers

A set of round helper functions help to simplify the process of querying historical round data, by surfacing more round information previously not captured in `AggregatorProxy` `Phase`s:

- `getRoundFeed()` returns the underlying aggregator for a specific round
- `getPhaseRange()` returns the starting and ending round ids of a phase
- `getPreviousRoundId()` and `getNextRoundId()` provides hypermedia-like links to query previous and next rounds even across multiple phases.

## Setup

```sh
$ yarn install
```

Create a `.env` following the `.env.example`:

```
INFURA_API_KEY=zzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzz
MNEMONIC=here is where your twelve words mnemonic should be put my friend
```

### Compile

Compile the smart contracts with Hardhat:

```sh
$ yarn compile
```

### TypeChain

Compile the smart contracts and generate TypeChain artifacts:

```sh
$ yarn typechain
```

### Lint Solidity

Lint the Solidity code:

```sh
$ yarn lint:sol
```

### Lint TypeScript

Lint the TypeScript code:

```sh
$ yarn lint:ts
```

### Test

Run the Mocha tests:

```sh
$ yarn test
```

To run a single test:

```sh
$ yarn test test/FeedRegistry.test.ts
```

### Coverage

Generate the code coverage report:

```sh
$ yarn coverage
```

### Clean

Delete the smart contract artifacts, the coverage reports and the Hardhat cache:

```sh
$ yarn clean
```

## Tooling

- [Hardhat](https://github.com/nomiclabs/hardhat): compile and run the smart contracts on a local development network
- [TypeChain](https://github.com/ethereum-ts/TypeChain): generate TypeScript types for smart contracts
- [Ethers](https://github.com/ethers-io/ethers.js/): renowned Ethereum library and wallet implementation
- [Waffle](https://github.com/EthWorks/Waffle): tooling for writing comprehensive smart contract tests
- [Solhint](https://github.com/protofire/solhint): linter
- [Solcover](https://github.com/sc-forks/solidity-coverage) code coverage
- [Prettier Plugin Solidity](https://github.com/prettier-solidity/prettier-plugin-solidity): code formatter
