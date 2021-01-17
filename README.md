# wBAN -- Wrapped Banano

This projet is part of a bigger one allowing to swap [Banano](https://banano.cc) crypto to `wBAN` (Wrapped Banano)
on Binance Smart Chain, and vice-versa.

`wBAN` is implemented as a [BEP20](https://github.com/binance-chain/BEPs/blob/master/BEP20.md) token.

This repository contains both the smart-contract code as well as the frontend.

## Setup

### Wallet setup

Copy the `.env.default` file as a `.env` file.

In the `.env` file change the mnemonic and write the one you are using with Metamask.

Next add a custom network in Metamask defined like this:
![Metamask setup for Hardhat](docs/hardhat-metamask-setup.png)

### Start development node

Install all the project dependencies: `yarn install`.

Simply running `yarn node:watch` will compile and deploy the smart-contract on a Hardhat EVM.

Every time the source code of the smart-contract is changed, it is redeployed on this EVM.

### Start frontend

In the `frontend` directory, install all the frontend dependencies: `yarn install`.

Then run `yarn serve`.

After frontend compilation, the dApp should be available at:
[http://localhost:8080](http://localhost:8080).

## Deployment Instructions

* Testnet: `yarn deploy:testnet`
