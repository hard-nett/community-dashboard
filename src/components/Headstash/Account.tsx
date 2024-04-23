import { Key } from '@keplr-wallet/types'
import CryptoJS from 'crypto-js'

// type Permit_for_FillerMsg = {
//   account_number: string | null
//   chain_id: string | null
//   memo: string | null
//   params: FillerMsg
//   sequence: string | null
//   signature: PermitSignature
// }
// type AddressProofMsg = {
//   address: string
//   amount: string
//   contract: string
//   index: number
//   key: string
// }
// type FillerMsg = {
//   coins: string[]
//   contract: string
//   execute_msg: EmptyMsg
//   sender: string
// }
// type PermitSignature = {
//   pub_key: PubKey
//   signature: Binary
// }
// type PubKey = {
//   type: string // Ignored, but must be "tendermint/PubKeySecp256k1"
//   value: Binary
// }
// type Binary = string // wrapper around Vec<u8>, represented as a string
// type EmptyMsg = Record<string, never>

type AccountObject = {
  claim: {
    eth_pubkey: string
    eth_sig: string
    // addresses: Permit_for_FillerMsg[]
    // padding: string | null
    // partial_tree: Binary[]
  }
}

// function createAddrProofMsg(address: string, amount: string, contract: string, index: number, key: string) {
//   const addrProofMsg: AddressProofMsg = {
//     address,
//     amount,
//     contract,
//     index,
//     key
//   }
//   return Buffer.from(JSON.stringify(addrProofMsg)).toString('base64')
// }

function createAccountObject(
  // contract: string,
  // sender: string,
  // pubkey: Key,
  eth_pubkey: string,
  eth_sig: string
  // partial_tree: string[],
  // memo: string,
  // signature: string
) {
  // const permitParams: Permit_for_FillerMsg = {
  //   account_number: null,
  //   chain_id: null,
  //   memo,
  //   params: {
  //     coins: [],
  //     contract,
  //     execute_msg: {},
  //     sender
  //   },
  //   sequence: null,
  //   signature: {
  //     pub_key: {
  //       type: 'tendermint/PubKeySecp256k1',
  //       value: Buffer.from(pubkey.pubKey).toString('base64')
  //     },
  //     signature
  //   }
  // }

  // Create the account object
  const accountObject: AccountObject = {
    claim: {
      eth_pubkey,
      eth_sig
      // addresses: [permitParams], // Array of Permit_for_FillerMsg objects
      // padding: null, // Optional field
      // partial_tree
    }
  }

  return accountObject
}
const createPermitSignature = async () => {
  //   setChainId(SECRET_TESTNET_CHAIN_ID)
  //   const { signature } = await window.keplr.signAmino(
  //     chainId,
  //     walletAddress,
  //     {
  //       chain_id: chainId,
  //       account_number: '0', // Must be 0
  //       sequence: '0', // Must be 0
  //       fee: {
  //         amount: [{ denom: 'uscrt', amount: '0' }], // Must be 0 uscrt
  //         gas: '1' // Must be 1
  //       },
  //       msgs: [
  //         {
  //           type: 'signature_proof',
  //           value: {
  //             coins: [],
  //             contract: headstashContract,
  //             execute_msg: {},
  //             sender: walletAddress
  //           }
  //         }
  //       ],
  //       memo: '' // Must be empty
  //     },
  //     {
  //       preferNoSetFee: true, // Fee must be 0, so hide it from the user
  //       preferNoSetMemo: true // Memo must be empty, so hide it from the user
  //     }
  //   )
  //   // setAddrProofMsg(signature)
  //   console.log(signature)
}

export { createAccountObject } // createAddrProofMsg
