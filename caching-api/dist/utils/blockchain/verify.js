import { ethers } from 'ethers'

// verifies like verifyEthSig, but expects signature to have been encrypted while passing to the api
export function verifyEncryptedEthSig(address, cosmos_addr, signature) {
  // Verification
  const recoveredAddress = ethers.verifyMessage(cosmos_addr, signature)
  if (recoveredAddress.toLowerCase() != address.toLowerCase()) {
    return 'Address not found'
  }
  return recoveredAddress
}
