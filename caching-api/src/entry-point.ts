'use strict';
import express from 'express';
import 'dotenv/config';
import https from 'https';
import { readFile } from 'fs/promises';
import fs from 'fs';
import toobusy from 'toobusy-js';
import Redis from 'ioredis';
import Redlock from 'redlock';

const PORT = process.env?.PORT ?? `3002`;
const HTTPS_PORT = process.env.HTTPS_PORT ?? '';
async function initDB() {
  // We start the db
  return new Redis();
}

async function initMutex(db) {
  const redlock = new Redlock(
    // You should have one client for each independent redis node
    // or cluster.
    [db],
    {
      // The expected clock drift; for more details see:
      // http://redis.io/topics/distlock
      driftFactor: 0.01,
      // The max number of times Redlock will attempt to lock a resource
      // before erroring.
      retryCount: 1,
      // the time in ms between attempts
      retryDelay: 200,
      // the max time in ms randomly added to retries
      // to improve performance under high contention
      // see https://www.awsarchitectureblog.com/2015/03/backoff.html
      retryJitter: 200,
      // The minimum remaining time on a lock before an extension is automatically
      // attempted with the `using` API.
      automaticExtensionThreshold: 500 // time in ms
    }
  );
  return redlock;
}
// We start the server
const app = express();
app.listen(parseInt(PORT), () => {
  console.log("Serveur à l'écoute ", PORT);
});
// Allow any to access this API.
app.use(function (_req, res, next) {
  res.header('Access-Control-Allow-Origin', '*');
  res.header(
    'Access-Control-Allow-Headers',
    'Origin, X-Requested-With, Content-Type, Accept'
  );
  next();
});
app.use(function (_req, res, next) {
  if (toobusy()) {
    res.status(503).send("I'm busy right now, sorry.");
  } else {
    next();
  }
});
async function main() {
  const db = await initDB();

  // Load data from the JSON file
  const rawAmountData = fs.readFileSync(
    `./${process.env.AMOUNT_JSON_PATH}`,
    'utf8'
  );
  const rawProofData = fs.readFileSync(
    `./${process.env.PROOF_JSON_PATH}`,
    'utf8'
  );
  const amountData = JSON.parse(rawAmountData.toString());
  const proofData = JSON.parse(rawProofData.toString());

  // Endpoint to get amount by address
  app.get('/getAmount/:address', (req, res) => {
    let { address } = req.params;

    // Convert both the requested address and data addresses to lowercase
    address = address.toLowerCase().trim();

    // Find the entry with the matching address (converted to lowercase and trimmed)
    const entry = amountData.find(
      (item) => item.address.toLowerCase().trim() === address
    );

    if (!entry) {
      return res.status(404).json({ error: 'Address not found' });
    }

    res.json({ amount: entry.amount });
  });

  // Endpoint to get proofs by address
  app.get('/getProofs/:address', (req, res) => {
    let { address } = req.params;

    // Convert both the requested address and data addresses to lowercase
    address = address.toLowerCase().trim();

    // Find the entry with the matching address (converted to lowercase and trimmed)
    const entry = proofData.find(
      (item) => item.address.toLowerCase().trim() === address
    );

    if (!entry) {
      return res.status(404).json({ error: 'Address not found' });
    }

    res.json({ proof: entry.proof });
  });

  if (process.env.EXECUTION == 'PRODUCTION') {
    const options = {
      cert: fs.readFileSync('/home/illiquidly/identity/fullchain.pem'),
      key: fs.readFileSync('/home/illiquidly/identity/privkey.pem')
    };
    https.createServer(options, app).listen(parseInt(HTTPS_PORT));
  }
}
main();
