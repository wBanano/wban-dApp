# wBAN -- Wrapped Banano

This projet is part of a bigger allowing to swap [Banano](https://banano.cc) crypto to `wBAN` (Wrapped Banano) on Binance Smart Chain,
and vice-versa.

`wBAN` are implemented as a [BEP20](https://github.com/binance-chain/BEPs/blob/master/BEP20.md) token.

## Build Instructions

Create a `secrets.json` file at the root of this directory.
Fill it with from this template:
```
{
	"mnemonic": "<your metamask mnemonic for example",
	"etherscanApiKey": "YourApiKeyToken"
}
```

* Tests: `yarn test`
* Code Coverage: `yarn coverage`
* SolHint: `npx hardhat check`
* Deploy: `yarn deploy:testnet`
