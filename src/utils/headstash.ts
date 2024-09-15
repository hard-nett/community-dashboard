// scrt-20 contract definitions
export const ibcSecretThiolContract = ''
export const ibcSecretTerpContract = 'secret1yj26ws6s6ze30zkrhntaa4a9kmt3f0zqw23f4l'
export const codeHash = 'e401bf5f5797ebc2fc75a60cefb7e8ebf6a005a5a3af540a47221dc3c1dabe6f'
export const headstashContract = 'secret1yj26ws6s6ze30zkrhntaa4a9kmt3f0zqw23f4l'
export const feegrantAddress = 'secret13uazul89dp0lypuxcz0upygpjy0ftdah4lnrs4'

export interface SigDetails {
  message: string
  signatureHash: any
  address: string
  timestamp: string
}

export interface AmountDetailsRes {
  amount: string
  // index: any
  // proofs: string[]
}
export const initialAmountDetails: AmountDetailsRes = {
  amount: ''
  // index: null,
  // proofs: ['']
}
export const initialSigDetails: SigDetails = {
  message: '',
  signatureHash: null,
  address: '',
  timestamp: ''
}

export interface ThrowawayWallet {
  privkey: string // base64 encoded privkey
  pubkey: string
}

export const initialThrowawayDetails: ThrowawayWallet = {
  privkey: '',
  pubkey: ''
}
