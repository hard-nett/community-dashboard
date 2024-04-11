import { Key } from '@keplr-wallet/types'
import CryptoJS from 'crypto-js'

type Permit_for_FillerMsg = {
  account_number: string | null
  chain_id: string | null
  memo: string | null
  params: FillerMsg
  sequence: string | null
  signature: PermitSignature
}

type AddressProofMsg = {
  address: string
  amount: string
  contract: string
  index: number
  key: string
}

type FillerMsg = {
  coins: string[]
  contract: string
  execute_msg: EmptyMsg
  sender: string
}

type PermitSignature = {
  pub_key: PubKey
  signature: Binary
}

type PubKey = {
  type: string // Ignored, but must be "tendermint/PubKeySecp256k1"
  value: Binary
}

type Binary = string // wrapper around Vec<u8>, represented as a string

type EmptyMsg = Record<string, never>
type AccountObject = {
  account: {
    addresses: Permit_for_FillerMsg[]
    eth_pubkey: string
    eth_sig: string
    padding: string | null
    partial_tree: Binary[]
  }
}

function createAddrProofMsg(address: string, amount: string, contract: string, index: number, key: string) {
  const addrProofMsg: AddressProofMsg = {
    address,
    amount,
    contract,
    index,
    key
  }
  return Buffer.from(JSON.stringify(addrProofMsg)).toString('base64')
}

function createAccountObject(
  contract: string,
  sender: string,
  pubkey: Key,
  eth_pubkey: string,
  eth_sig: string,
  partial_tree: string[],
  memo: string,
  signature: string
) {
  const permitParams: Permit_for_FillerMsg = {
    account_number: null,
    chain_id: null,
    memo,
    params: {
      coins: [],
      contract,
      execute_msg: {},
      sender
    },
    sequence: null,
    signature: {
      pub_key: {
        type: 'tendermint/PubKeySecp256k1',
        value: Buffer.from(pubkey.pubKey).toString('base64')
      },
      signature
    }
  }

  // Create the account object
  const accountObject: AccountObject = {
    account: {
      addresses: [permitParams], // Array of Permit_for_FillerMsg objects
      eth_pubkey,
      eth_sig,
      padding: null, // Optional field
      partial_tree
    }
  }

  return accountObject
}

// TODO: generate signature for connected wallet
function sigForAddrProofMsg() {
  const sig = ''
  return sig
}

export { createAccountObject, createAddrProofMsg, sigForAddrProofMsg }
