<!-- ![Secret Network Banner](banner.png) -->\

# TODO

- ui: display balance for each snip120 token included in headstash instance
- ui: implement ibc-bloom logic
- faucet: encrypt faucet tx with ecies [wasm-bindgen](https://github.com/ecies/rs-wasm) package
- ui: completely remove any development logs to mimimize data leak
- ui: enforce only one wallet (eth or solana) connected to site at a time.
- throwaway-wallet: store offline solution such as jackal
- throwaway-wallet: store privkey w/ timestamped/session index for retrival & pruning
- ~~ui: wrap headstash msgs with feegrant from Protocol owned ICA on Secret.~~
- ~~ui: add disposable wallet support: generate new wallet, store privkey in localstorage,~~

# Headstash Dashboard

Headstash Dashboard is an entry point for new users into the Cosmos Ecosystem. Features include a Dashboard UI to claim a headstash distribution they are eligible for, IBC Transfer to and from Secret, a Wrap/Unwrap interface, a list of all active Secret dApps, a link collection to useful secret tools and more.

## Headstash LifeCycle

### Connect Eligible Wallet

### Generate Throwaway Wallet

### Verify Ownership

### Register For FeeGrant

### Claim Headstash

### Privately IBC Transfer tokens back to Terp Network

## Future Features

- display list of available headstashes
- create new headstash
- account profile
- verification tooling

## Setup

After verifying the system requirements you should be able to run a few commands to get everything set up:

```
git clone https://github.com/terpnetwork/headstash-ui
cd headstash-ui
npm install
```

## Running the app

### The good ol' classic way

To get the app up and running, run:

```
npm run start
```

The App runs on port 3000.

### Docker

To get the app up and running inside Docker, run:

```
docker compose up
```

The App runs on port 3000. For further information check the `Dockerfile` and the `docker-compose.yml`.

## License

Developed by [Secret Jupiter](https://x.com/secretjupiter_) and [Secret Saturn](https://x.com/Secret_Saturn_)
Licensed under the [MIT license](https://github.com/scrtlabs/dash.scrt.network/blob/master/LICENSE.md)
