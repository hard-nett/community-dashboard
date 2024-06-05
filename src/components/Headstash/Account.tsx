import { Key } from '@keplr-wallet/types'
import CryptoJS from 'crypto-js'

type AccountObject = {
  claim: {
    eth_pubkey: string
    eth_sig: string
    // addresses: Permit_for_FillerMsg[]
    // padding: string | null
    // partial_tree: Binary[]
  }
}

function createAccountObject(eth_pubkey: string, eth_sig: string) {
  // Create the account object
  const accountObject: AccountObject = {
    claim: {
      eth_pubkey,
      eth_sig
    }
  }

  return accountObject
}

export { createAccountObject } // createAddrProofMsg
