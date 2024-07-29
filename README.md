<!-- ![Secret Network Banner](banner.png) -->\

# TODO

- create new active ibc-paths
- Set SNIP20 addrs for testnet TERP & THIOL
- minimic governance workflow for deployment

# Headstash Dashboard

Headstash Dashboard is an entry point for new users into the Cosmos Ecosystem. Features include a Dashboard UI for Secret Network data, IBC Transfer to and from Secret, a Wrap/Unwrap interface, a list of all active Secret dApps, a link collection to useful secret tools and more.

## System Requirements

- [Node.js 20 LTS](https://nodejs.org/)

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
