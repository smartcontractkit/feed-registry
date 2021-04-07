# Chainlink Feed Registry

- [Hardhat](https://github.com/nomiclabs/hardhat): compile and run the smart contracts on a local development network
- [TypeChain](https://github.com/ethereum-ts/TypeChain): generate TypeScript types for smart contracts
- [Ethers](https://github.com/ethers-io/ethers.js/): renowned Ethereum library and wallet implementation
- [Waffle](https://github.com/EthWorks/Waffle): tooling for writing comprehensive smart contract tests
- [Solhint](https://github.com/protofire/solhint): linter
- [Solcover](https://github.com/sc-forks/solidity-coverage) code coverage
- [Prettier Plugin Solidity](https://github.com/prettier-solidity/prettier-plugin-solidity): code formatter

## Background

Some DeFi protocols are building their own Feed Registries ([Yearn](https://github.com/yearn/audit/blob/4b07283c80fc005e899afa8b5fb2bb949fe11f28/contracts/ySwap/ChainLinkFeedsRegistry.sol), [Aave](https://github.com/aave/protocol-v2/blob/2708551bcf3afb28ee9798ccf7f3027ea0ecec10/contracts/misc/AaveOracle.sol#L25), [Synthetix](https://github.com/Synthetixio/synthetix/blob/c803c3b51d026bb4552a0e1a9bcc55914502a8d4/contracts/ExchangeRates.sol#L32)) that maps assets (token address) to Chainlink aggregators. Any DeFi protocol that has collateralization (where they need to calculate the value of deposited assets) likely needs to do something similar.

To speed up integration and ensure that protocols use the correct feeds, Chainlink can provide a canonical on-chain registry of assets to feeds.

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
$ yarn test test/FeedRegistry.ts
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
