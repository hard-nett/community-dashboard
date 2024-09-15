import { Helmet } from 'react-helmet-async'
import React, { useEffect, useState } from 'react'

import toast from 'react-hot-toast'

import { bridgeJsonLdSchema, bridgePageDescription, headstashPageTitle, randomPadding } from 'utils/commons'
import { useSecretNetworkClientStore } from 'store/secretNetworkClient'

import { useIsClient } from 'hooks/useIsClient'
import Title from 'components/Title'
import MetamaskConnectButton from 'components/Wallet/metamask-connect-button'
import Wallet from 'components/Wallet/Wallet'
import {
  EncryptionUtilsImpl,
  MsgExecuteContract,
  MsgExecuteContractResponse,
  SecretNetworkClient,
  toUtf8
} from 'secretjs'
import { Nullable } from 'types/Nullable'
import { WalletService } from 'services/wallet.service'
import { SECRET_TESTNET_CHAIN_ID, SECRET_TESTNET_LCD } from 'utils/config'
import {
  Carousel,
  CarouselApi,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious
} from 'components/UI/carousel'
import { convertMicroDenomToDenomWithDecimals } from 'utils/tokens'
import {
  AmountDetailsRes,
  SigDetails,
  ThrowawayWallet,
  codeHash,
  feegrantAddress,
  headstashContract,
  ibcSecretTerpContract,
  initialAmountDetails,
  initialSigDetails,
  initialThrowawayDetails
} from 'utils/headstash'
import { getShortAddress, getShortTxHash } from 'utils/getShortAddress'
import ActionableStatus from 'components/FeeGrant/components/ActionableStatus'
import { createThrowawayAccount } from 'components/Headstash/Account'

function Headstash() {
  // network config state
  const [secretjs, setSecretjs] = useState<Nullable<SecretNetworkClient>>(null)
  const [apiUrl, setApiUrl] = useState<string>(SECRET_TESTNET_LCD)
  const [isVerified, setIsVerified] = useState(false)
  const [isloading, setLoading] = useState(false)
  const { walletAddress, walletAPIType, isConnected, unEncryptedEthSig, setUnencryptedEthSig, feeGrantStatus } =
    useSecretNetworkClientStore()
  // pubkey states (eth, sol)
  const [walletType, setWalletType] = useState('eth')
  const [eth_pubkey, setEthPubkey] = useState('')
  const [sol_pubkey, setSolPubkey] = useState('')
  const [throwaway_pubkey, setThrowawayPubkey] = useState<ThrowawayWallet>(initialThrowawayDetails)
  const [solSigDetails, setSolSigDetails] = useState<SigDetails>(initialSigDetails)
  const [ethSigDetails, setEthSigDetails] = useState<SigDetails>(initialSigDetails)
  const [encryptedEthSig, setEncryptedEthSig] = useState<Uint8Array>()
  // airdrop amount state
  const [amountDetails, setAmountDetails] = useState<AmountDetailsRes>(initialAmountDetails)
  const [amountState, setAmountState] = useState<FetchAmountState>('not_fetched_yet')
  type FetchAmountState = 'loading' | 'no_allocation' | 'amounts_fetched' | 'not_fetched_yet'
  // feegrant state
  type FeeGrantState = 'loading' | 'already_granted' | 'not_requested' | 'granted' | 'not_granted'

  const [api, setApi] = useState<CarouselApi>()

  useEffect(() => {
    const handleWalletDisconnect = () => {
      setEthPubkey('')
      setSolPubkey('')
      handleHsDetails(initialAmountDetails, 'not_fetched_yet')
      setEthPubkey('')
      setSolPubkey('')
    }
    // Check if window.ethereum is available
    if (eth_pubkey != '') {
      // Listen for wallet disconnect events
      ;(window as any).ethereum.on('disconnect', handleWalletDisconnect)
    }
    if (sol_pubkey != '') {
      // Listen for solana wallet disconnect events
      ;(window as any).solana.on('disconnect', handleWalletDisconnect)
    }

    console.log(eth_pubkey)
    console.log(sol_pubkey)
    console.log('headstash detials:', amountDetails.amount)
    // clean event listener on unmount
    return () => {
      if (eth_pubkey != '') {
        ;(window as any).ethereum.off('disconnect', handleWalletDisconnect)
      }
    }
  }, [eth_pubkey])

  // handle eth wallet connect
  const handleEthPubkey = (eth_pubkey: string) => {
    setEthPubkey(eth_pubkey)
  }
  // handle solana wallet connect
  const handleSolPubkey = (sol_pubkey: string) => {
    // set pubkey
    setSolPubkey(sol_pubkey)
  }

  // set headstash detials
  const handleHsDetails = (amountDetails: AmountDetailsRes, state: FetchAmountState) => {
    console.log(amountDetails)
    console.log(amountState)
    setAmountDetails(amountDetails)
    setAmountState(state)
  }

  // fetch headstash data
  useEffect(() => {
    // Define a function to fetch the headstash amount
    const fetchHeadstash = async (pubkey: string) => {
      try {
        // Check if eth_pubkey exists
        if (String(pubkey).startsWith('0x1') && !eth_pubkey) {
          toast.error('eth_pubkey is required')
          console.error('eth_pubkey is required')
          return
        } else if (!eth_pubkey && !sol_pubkey) {
          toast.error('sol_pubkey is required')
          console.error('sol_pubkey is required')
        }

        // Set loading state to true
        setLoading(true)
        const headstashDetailsAPI = `http://localhost:3001/getHeadstash/${pubkey}`

        // GET request for amounts
        const amounts = await fetch(headstashDetailsAPI)
        if (amounts.ok) {
          const result = await amounts.json()
          handleHsDetails(result, 'amounts_fetched')
          console.log('headstash detials:', result)
        } else {
          console.error('cannot get headstash amounts:', amounts.status)
        }

        setLoading(false)
      } catch (err) {
        toast.error(`${err}`)
        console.error(err)
        setLoading(false)
      }
    }
    // Call the fetchHeadstash function when eth_pubkey changes
    if (eth_pubkey) {
      fetchHeadstash(eth_pubkey).then(() => {
        handleEthSig()
      })
    }
    if (sol_pubkey != '' && amountState == 'not_fetched_yet') {
      fetchHeadstash(sol_pubkey).then(() => {
        handleSolanaSig()
      })
    }
  }, [eth_pubkey, sol_pubkey])

  // create eth sig
  const handleEthSig = async () => {
    try {
      if (!isConnected || !eth_pubkey) {
        toast.error(
          'Unable to sign verification message. Please ensure both Metamask & the desired interchain wallet are connected.'
        )
        return
      }

      // define the msg to sign
      if (walletAddress !== undefined) {
        const cosmosAddress = walletAddress.toString()
        const from = eth_pubkey
        const msg = `0x${Buffer.from(cosmosAddress, 'utf8').toString('hex')}`

        // trigger metamask
        const sign = await (window as any).ethereum.request({
          method: 'personal_sign',
          params: [msg, from]
        })

        // define sig result type
        const sig = {
          message: cosmosAddress,
          signatureHash: sign,
          address: from,
          timestamp: new Date().toISOString()
        }

        console.log('Signature object:', sig)

        // set values to local-storage
        setEthSigDetails(sign)
        setIsVerified(true)
        setUnencryptedEthSig(sig.signatureHash)
      } else {
        toast.error('Error Updating ethSig.')
      }
    } catch (error) {
      console.error('Error during handleEthSig:', error)
      let errorMessage = error instanceof Error ? error.message : JSON.stringify(error)
      toast.error(errorMessage)
    }
  }
  // TODO: get randomness from nois
  const entropy = 'eretskeretjableret'

  /// SOLANA UTILS

  // get solana wallet provider from browser
  const getProvider = () => {
    if ('solana' in window) {
      const provider = window.solana as any
      if (provider.isPhantom) {
        return provider
      }
    }
    window.open('https://phantom.app/', '_blank')
  }

  const handleSolanaSig = async () => {
    // connects, checks eligiblility, prompts signature
    try {
      const provider = getProvider()
      if (!provider) {
        console.error('Phantom wallet not found')
      } else {
        await provider.connect() // Connect to the wallet
      }

      handleSolPubkey(provider.publicKey)

      // generate throwaway wallet
      let throwaway = createThrowawayAccount()

      // form solana msg to sign
      const wallet = {
        publicKey: provider.publicKey,
        signTransaction: provider.signTransaction.bind(provider),
        signAllTransactions: provider.signAllTransactions.bind(provider)
      }

      const cosmosAddress = walletAddress.toString()
      const messageBytes = Buffer.from(`HREAM ~ ${throwaway.address} ~ ${cosmosAddress}`, 'utf8')

      // sign the transaction using Phantom wallet (returns bytes)
      const payloadSignature = await provider.signMessage(messageBytes)

      // return expected sig response type
      const sig: SigDetails = {
        message: messageBytes.toString('base64'),
        signatureHash: payloadSignature.signature.toString('base64'),
        address: payloadSignature.publicKey,
        timestamp: new Date().toISOString()
      }
      console.log('Signature object:', sig)
      setSolSigDetails(sig)
      return sig
    } catch (error) {
      console.error(error)
    }
  }

  const handleSolanaDisconnect = async () => {
    // get solana wallet provider from browser
    const provider = getProvider()

    if (provider) {
      try {
        // Disconnect from Phantom wallet
        await provider.disconnect()
        // Update state to reflect disconnect
        setSolPubkey('')
      } catch (error) {
        console.error('Error disconnecting from Phantom wallet', error)
      }
    }
  }

  const claimHeadstashMsg = async () => {
    try {
      const { secretjs: importedSecretjs } = await WalletService.connectWallet(
        'throwaway', // grabs throwaway mnemonic from localstorage
        apiUrl,
        SECRET_TESTNET_CHAIN_ID
      )
      setSecretjs(importedSecretjs)

      if (ethSigDetails.signatureHash != '' && amountState == 'amounts_fetched') {
        const claim = { eth_pubkey, eth_sig: ethSigDetails.signatureHash, heady_wallet: walletAddress }

        const msgExecute = new MsgExecuteContract({
          sender: secretjs.address,
          contract_address: headstashContract,
          code_hash: codeHash,
          msg: toUtf8(JSON.stringify(claim)),
          sent_funds: []
        })

        const tx = await secretjs.tx.broadcast([msgExecute], {
          gasLimit: Math.ceil(parseInt('000000') * 2),
          gasPriceInFeeDenom: parseInt('0.05'),
          feeDenom: 'uscrt',
          feeGranter: feegrantAddress
        })
        console.log('Execution Result:', msgExecute)
        console.log('Execution Result:', tx.transactionHash)
        toast.success(`View Tx Hash: ${getShortTxHash(tx.transactionHash)}`)
      }
    } catch (error) {
      let errorMessage: string
      if (error instanceof Error) {
        errorMessage = error.message
      } else {
        errorMessage = JSON.stringify(error)
        toast.error(errorMessage)
      }
    }
  }

  return (
    <>
      <Helmet>
        <title>Private Headstash</title>
        <meta charSet="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <meta name="title" content={headstashPageTitle} />
        <meta name="application-name" content={headstashPageTitle} />
        <meta name="description" content={bridgePageDescription} />
        <meta name="robots" content="index,follow" />
        <meta property="og:title" content={headstashPageTitle} />
        <meta property="og:description" content={bridgePageDescription} />
        {/* <meta property="og:image" content="Image URL Here"/> */}
        <meta name="twitter:title" content={headstashPageTitle} />
        <meta name="twitter:description" content={bridgePageDescription} />
        {/* <meta name="twitter:image" content="Image URL Here"/> */}

        <script type="application/ld+json">{JSON.stringify(bridgeJsonLdSchema)}</script>
      </Helmet>
      <div className="max-w-2xl mx-auto px-6 text-neutral-600 dark:text-neutral-400 leading-7 text-justify">
        {/* Title */}
        <Carousel setApi={setApi}>
          <CarouselContent>
            <CarouselItem className="basis">
              <Title title={'1. Connect Wallets'} />
              <center>
                <div className="text-neutral-400 dark:text-neutral-500 text-sm font-semibold mb-0.5">
                  First, we need to generate an offline signature from Metamask or Phantom. This signature does not
                  require any gas payments, does not interact, grant authorization or involve funds held by the
                  accounts, and verifies only you can claim your private headstash.
                </div>
                {!sol_pubkey && <MetamaskConnectButton handleEthPubkey={handleEthPubkey} />}
                <br />
                {!eth_pubkey && (
                  <div>
                    <div className="text-neutral-400 dark:text-neutral-500 text-sm font-semibold mb-0.5">Solana</div>
                    {sol_pubkey != '' ? (
                      <button
                        style={{}}
                        className="text-white block my-6 p-3 w-full text-center font-semibold bg-cyan-600 dark:bg-cyan-600 rounded-lg text-sm hover:bg-cyan-500 dark:hover:bg-cyan-500 focus:bg-cyan-600 dark:focus:bg-cyan-600 transition-colors"
                        onClick={handleSolanaDisconnect}
                      >
                        Disconnect Phantom Wallet
                      </button>
                    ) : (
                      <button
                        style={{}}
                        className="text-white block my-6 p-3 w-full text-center font-semibold bg-cyan-600 dark:bg-cyan-600 rounded-lg text-sm hover:bg-cyan-500 dark:hover:bg-cyan-500 focus:bg-cyan-600 dark:focus:bg-cyan-600 transition-colors"
                        onClick={handleSolanaSig}
                      >
                        {sol_pubkey.length > 0 ? (
                          `${sol_pubkey.substring(0, 6)}...${sol_pubkey.substring(38)}`
                        ) : (
                          <span>Check Eligibility And Claim Headstash With Phantom Wallet</span>
                        )}
                      </button>
                    )}
                  </div>
                )}
                <div className="text-neutral-400 dark:text-neutral-500 text-sm font-semibold mb-0.5">Cosmos Wallet</div>
                <Wallet />
              </center>
            </CarouselItem>
            <CarouselItem>
              {' '}
              <Title title={'2. Claim Headstash'} />
              <center>
                <div className="text-neutral-400 dark:text-neutral-500 text-sm font-semibold mb-0.5">
                  Claims your headstash privately. This does requires SCRT tokens, to pay for on-chain transaction gas
                  fees.
                </div>
                <button
                  className="text-white block my-6 p-3 w-full text-center font-semibold bg-cyan-600 dark:bg-cyan-600 rounded-lg text-sm hover:bg-cyan-500 dark:hover:bg-cyan-500 focus:bg-cyan-600 dark:focus:bg-cyan-600 transition-colors"
                  onClick={claimHeadstashMsg}
                  style={{ filter: unEncryptedEthSig ? 'none' : 'blur(5px)' }}
                  disabled={!walletAddress || !isConnected || !eth_pubkey || !unEncryptedEthSig}
                >
                  Claim Headstash Airdrop
                </button>
                <p className="text-neutral-400 dark:text-neutral-500 text-sm font-semibold mb-0.5">
                  <span className="select-none">
                    <ActionableStatus /> –{' '}
                  </span>
                  Bypass your first few transactions fees required on Secret Network.
                </p>
              </center>
            </CarouselItem>
          </CarouselContent>
          <CarouselPrevious />
          <CarouselNext />
        </Carousel>
        <br />
        <div className="rounded-xl bg-white border border-neutral-200 dark:border-neutral-700 dark:bg-neutral-800 h-full flex items-center px-4 py-2">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4">
            <div>
              <h2 className="text-center inline-block">Headstash Details</h2>
              <div className="text-neutral-400 dark:text-neutral-500 text-sm font-semibold mb-0.5">Address:</div>
              <div className="text-neutral-400 dark:text-neutral-500 text-sm font-semibold mb-0.5">Amount:</div>
              <div className="text-neutral-400 dark:text-neutral-500 text-sm font-semibold mb-0.5">
                Signed:{' '}
                {ethSigDetails && ethSigDetails !== initialSigDetails ? (
                  <span style={{ color: 'green' }}>✓</span>
                ) : (
                  <span style={{ color: 'red' }}>x</span>
                )}
              </div>
              <div className="text-neutral-400 dark:text-neutral-500 text-sm font-semibold mb-0.5">
                FeeGrant:{' '}
                {feeGrantStatus === 'success' ? (
                  <span style={{ color: 'green' }}>✓</span>
                ) : (
                  <span style={{ color: 'red' }}>x</span>
                )}
              </div>
            </div>
            <div className="flex-1 text-right font-bold inline text-transparent bg-clip-text bg-gradient-to-r from-cyan-500 to-teal-500">
              <br />
              {eth_pubkey}
              <p>{convertMicroDenomToDenomWithDecimals(amountDetails.amount, 6)}</p>{' '}
              {/* TODO: fix bug here clearning amount data upon wallet disconnect*/}
            </div>
          </div>
          <div className="flex-1 text-right" />
        </div>
        <div>{/* {ethSigDetails !== null && <p>eth_sig: {ethSigDetails.signatureHash}</p>} */}</div>
      </div>
    </>
  )
}

export default Headstash
