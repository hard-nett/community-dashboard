import { Wallet } from 'secretjs'

type AccountObject = {
  claim: {
    eth_pubkey: string
    eth_sig: string
    // addresses: Permit_for_FillerMsg[]
    // padding: string | null
    // partial_tree: Binary[]
  }
}

function createThrowawayAccount(eth: string) {
  // check if theres existing throwaway wallet with pubkey
  // get throwaway privkey from localstorage
  const item = localStorage.getItem(`throwawayPrivateKey-${eth}`)

  if (item) {
    const wallet = new Wallet(item)
    return wallet
  }
  // create disposable wallet
  const wallet = new Wallet()

  // base64 encoding
  let mnemonic_hash = btoa(wallet.mnemonic.toString())
  // save privkey to localstorage
  saveMnemonicToLocalStorage(mnemonic_hash, eth)

  return wallet
}
const saveMnemonicToLocalStorage = async (privateKey: string, eth: string) => {
  try {
    // Check if local storage is available
    if (typeof window !== 'undefined' && window.localStorage) {
      // Save the private key to local storage
      window.localStorage.setItem(`throwawayPrivateKey-${eth}`, privateKey)
      console.log('Private key saved to local storage')
    } else {
      console.error('Local storage is not available')
    }
  } catch (error) {
    console.error('Error saving private key to local storage:', error)
  }
}

export { createThrowawayAccount } // createAddrProofMsg
