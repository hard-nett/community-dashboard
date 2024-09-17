# Headstash UI

# TODO

- ui: improve design
- throwaway-wallet: store privkey w/ timestamped/session index for retrival & pruning,prune throwaway wallets after 24 hours
- ui: completely remove any development logs to mimimize data leak
- throwaway-wallet: store offline solution such as jackal
- throwaway-wallet: fix button to reveal mnemonic from local storage
- dev-ops: akash delployment scripts

---

- ~~faucet: encrypt faucet tx with ecies [wasm-bindgen](https://github.com/ecies/rs-wasm) package~~
- ~~ibc-bloom: load connected wallet as destination, use throwaway to broadcast with feegrant~~
- ~~ibc-bloom: implement ibc-bloom logic~~
- ~~ui: block signature prompt if no balance~~
- ~~ui: prompt confirmation of use of specific throwaway wallet during signatures~~
- ~~ui: display balance for each snip120 token included in headstash instance~~
- ~~ui: enforce only one wallet (eth or solana) connected to site at a time.~~
- ~~ui: wrap headstash msgs with feegrant from Protocol owned ICA on Secret.~~
- ~~ui: add disposable wallet support: generate new wallet, store privkey in localstorage,~~

# Headstash Dashboard

Headstash Dashboard is an entry point for new users into the Cosmos Ecosystem. Features include a Dashboard UI to claim a headstash distribution they are eligible for, IBC Transfer to and from Secret, a Wrap/Unwrap interface, a list of all active Secret dApps, a link collection to useful secret tools and more.

## Headstash LifeCycle

### Connect Eligible Wallet

Any Ethereum or Solana address is able to be considered eligible for headstashes. Claimers will choose between the two wallet types to connect, and will automatically generate a prompt specific to if they are eligible.

### Generate Throwaway Wallet

If an account is eligible, the next prompts ask the account owner to confirm the throwaway wallet to use to claim their headstash, before verifying their ownership.

### Verify Ownership

Once the throwaway wallet is generated and confirmed, a prompt to generate a signature using either Metamask or Phantom wallet occurs.

### Register For FeeGrant

Feegrants can be requested only be eligible claimers, and requires providing the signature to an external API, to verify a wallet can request a feegrant. To minimize the chance of leaking the signature to the public, we include ecies encryption via the ecies-wasm package.

### Claim Headstash

Now, thats left to do is claim a headstash by broadcasting the msg to claim, with the throwaway wallet, while having this tx covered if the feegrant was needed/registered.

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

### Ecies-Wasm

Build and test

```sh
wasm-pack build
wasm-pack test --node
```

## License

Developed by [Secret Jupiter](https://x.com/secretjupiter_) and [Secret Saturn](https://x.com/Secret_Saturn_)
Licensed under the [MIT license](https://github.com/scrtlabs/dash.scrt.network/blob/master/LICENSE.md)
