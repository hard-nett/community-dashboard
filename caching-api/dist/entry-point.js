'use strict'
import express from 'express'
import 'dotenv/config'
import https from 'https'
import fs from 'fs'
import toobusy from 'toobusy-js'
import { myFunction } from './utils/blockchain/verify.js'
import { Wallet, SecretNetworkClient, validateAddress, BroadcastMode } from 'secretjs'

// endpoint stuff
const PORT = process.env.PORT || '300'
const SECRET_CHAIN_ID = process.env.CHAIN_ID || 'pulsar-3'
const SECRET_LCD = process.env.LCD_NODE || 'https://lcd.mainnet.secretsaturn.net'

// wallet stuff
const mnemonic = process.env.FAUCET_MNEMOMIC || undefined
const wallet = new Wallet(
  'goat action fuel major strategy adult kind sand draw amazing pigeon inspire antenna forget six kiss loan script west jaguar again click review have'
)
const faucetAddress = wallet.address

// feegrant tx stuff
const faucetAmount = process.env.FAUCET_AMOUNT || '10000'
const faucetDenom = process.env.FAUCET_DENOM || 'uscrt'
const faucetReload = process.env.FAUCET_RELOAD_TIME || '24'
const faucetReloadHours = Number(faucetReload)
const faucetReloadSeconds = Math.ceil(faucetReloadHours * 3600)
const gasDenom = process.env.GAS_DENOM || 'uscrt'
const gasFee = process.env.GAS_FEE || '0.5'
const gasLimit = process.env.GAS_LIMIT || '17500'
const memo = process.env.MEMO || ''

// new secret network client
const secretjs = new SecretNetworkClient({
  url: SECRET_LCD,
  chainId: SECRET_CHAIN_ID,
  wallet: wallet,
  walletAddress: faucetAddress
})

// We start the server
const app = express()

app.listen(parseInt(PORT), () => {
  if (mnemonic === undefined) {
    throw Error('no mnemonic defined, aborting')
  }
  console.log("Serveur à l'écoute ", PORT)
})

// Allow any to access this API.
app.use(function (_req, res, next) {
  res.header('Access-Control-Allow-Origin', '*')
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept')
  next()
})
// handle overload of API
app.use(function (_req, res, next) {
  if (toobusy()) {
    res.status(503).send("I'm busy right now, sorry.")
  } else {
    next()
  }
})

async function main() {
  // load json use to generate merkle tree root
  const rawAmountData = fs.readFileSync(`./${process.env.AMOUNT_JSON_PATH}`, 'utf8')
  const amountData = JSON.parse(rawAmountData.toString())

  // entry point
  app.get('/getHeadstash/:address', (req, res) => {
    let { address } = req.params

    // Convert both the requested address and data addresses to lowercase
    address = address.toLowerCase().trim()

    // Find the entry with the matching address (converted to lowercase and trimmed)
    const entry = amountData.find((item) => item.address.toLowerCase().trim() === address)

    if (!entry) {
      return res.status(404).json({ error: 'Address not found' })
    }
    res.json({ amount: entry.amount })
  })

  app.get('/registerFeeGrant/:address/:cosmos/:signature', async (req, res) => {
    let { address } = req.params
    let { cosmos } = req.params
    let { signature } = req.params

    address = address.toLowerCase().trim()
    // Find the entry with the matching address
    const entry = amountData.find((item) => item.address.toLowerCase().trim() === address)

    if (!entry) {
      return res.status(404).json({ error: '#01 eth_pubkey not included in airdrop' })
    }

    // verify the cosmos address
    if (!cosmos) {
      return res.status(400).json({ error: 'Address is required' })
    }
    if (!validateAddress(cosmos).isValid) {
      return res.status(400).json({ error: 'Address is invalid' })
    }

    // verify eth_sig comes from address
    let isCorrectSig = myFunction(address, cosmos, signature)
    if (isCorrectSig.toLowerCase() !== address.toLowerCase()) {
      return res.status(404).json({ error: 'Unexpected Error' })
    }

    // verify cosmos wallet does not already have balance
    try {
      // check if feegrant already exists or is expired
      // secretjs.query.feegrant
      //   .allowance({ grantee: cosmos, granter: faucetAddress })
      //   .then(async result => {
      //     console.log("result:", result);
      //     if (result?.allowance) {
      //       if (isFeeGrantExpired(result.allowance.allowance.expiration, faucetReloadSeconds)) {
      //         console.log("Fee Grant expired");
      //         const feeGrant = await broadcastFeeGrant(secretjs, cosmos);
      //         const results = { feeGrant };
      //         return res.json(results);
      //       }
      //       else {
      //         console.log("Existing Fee Grant");
      //         const results = { feegrant: result.allowance, address: cosmos };
      //         return res.json(results);
      //       }
      //     } else {
      console.log('new feegrant')
      const feeGrant = await broadcastFeeGrant(secretjs, cosmos)
      const results = { feeGrant }
      return res.json(results)
      //   }
      // }).catch(async (e) => {
      //   console.error(e);
      //   return res.status(400).json({ error: e });
      // })
    } catch (error) {
      console.error(error)
      return res.status(500).send('Internal Server Error')
    }
  })

  if (process.env.EXECUTION == 'PRODUCTION') {
    const options = {
      cert: fs.readFileSync('/home/illiquidly/identity/fullchain.pem'),
      key: fs.readFileSync('/home/illiquidly/identity/privkey.pem')
    }
    https.createServer(options, app).listen(parseInt(PORT))
  }
}
main()

function isFeeGrantExpired(expirationTime, extraSeconds) {
  // Parse the expiration time into a Date object
  const expirationDate = new Date(expirationTime)

  // Get the current time as a Date object
  const currentDate = new Date()

  // Add the extra number of seconds to the current time
  const adjustedCurrentDate = new Date(currentDate.getTime() + extraSeconds)
  return adjustedCurrentDate > expirationDate
}

// broadcast the feegrant msg
let broadcastFeeGrant = async (secretjs, cosmos_addr) => {
  let msg = await secretjs.tx.feegrant.grantAllowance(
    {
      granter: wallet.address,
      grantee: cosmos_addr,
      allowance: {
        allowance: { spend_limit: [{ denom: faucetDenom, amount: faucetAmount }] },
        allowed_messages: ['/secret.compute.v1beta1.MsgExecuteContract']
      }
    },
    {
      memo: memo,
      broadcastCheckIntervalMs: 100,
      feeDenom: gasDenom,
      gasPriceInFeeDenom: Number(gasFee),
      gasLimit: Number(gasLimit),
      broadcastMode: BroadcastMode.Block
    }
  )

  return msg
}
