# Arc Pulse

A live network dashboard for [Arc Testnet](https://docs.arc.io) — Circle's Layer-1 blockchain where **USDC is the native gas token**.

**Live:** [arc.editio.me](https://arc.editio.me)

## What it does

Single static HTML file. No backend, no build step, no tracking. It talks directly to Arc Testnet's public JSON-RPC from the browser and shows:

- Latest block height, updating live
- Transfer fee and gas price — **priced in dollars**, since gas on Arc is USDC
- Rolling block time / throughput stats
- Live feed of recent blocks and transactions, linked to [Arcscan](https://testnet.arcscan.app)
- Address balance + nonce lookup
- One-click "Add Arc Testnet to wallet" (`wallet_addEthereumChain`)

## Why

Arc's defining feature — dollar-denominated gas instead of a volatile native token — is easy to state and hard to *feel*. Arc Pulse makes it visible: watch real transfer fees settle at fractions of a cent, in USDC, block by block.

## Run it

It's one file. Open `index.html` in a browser, or serve it:

```bash
python -m http.server 8931
```

## Stack

Vanilla HTML/CSS/JS. Falls over three public RPC endpoints (`rpc.testnet.arc.network`, dRPC, Blockdaemon) if one is slow or down.

## License

MIT
