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
  HeadstashAllocation,
  HeadstashItem,
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
import HeadstashApiTable from '@/components/Headstash/ApiTable'
import Modal from '@/components/UI/Modal/Modal'

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
  const [exporting_mnemonic, setExportingMnemonic] = useState(false)

  const [modal_state, setModalState] = useState(false)
  const [gen_sig, setSignatureState] = useState(false)
  const [throwaway_pubkey, setThrowawayPubkey] = useState<ThrowawayWallet>(initialThrowawayDetails)
  const [sigDetails, setSigDetails] = useState<SigDetails>(initialSigDetails)
  const [encryptedEthSig, setEncryptedEthSig] = useState<Uint8Array>()
  // airdrop amount state
  const [amountDetails, setAmountDetails] = useState<HeadstashAllocation>(initialAmountDetails)
  const [amountState, setAmountState] = useState<FetchAmountState>('not_fetched_yet')
  type FetchAmountState = 'loading' | 'no_allocation' | 'amounts_fetched' | 'not_fetched_yet'
  // feegrant state
  type FeeGrantState = 'loading' | 'already_granted' | 'not_requested' | 'granted' | 'not_granted'

  const [api, setApi] = useState<CarouselApi>()

  useEffect(() => {
    const handleWalletDisconnect = () => {
      setEthPubkey('')
      setSolPubkey('')
      setSignatureState(false)
      handleHsDetails(initialAmountDetails, 'not_fetched_yet')
      setSigDetails(initialSigDetails)
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

    // clean event listener on unmount
    return () => {
      if (eth_pubkey != '') {
        ;(window as any).ethereum.off('disconnect', handleWalletDisconnect)
      }
    }
  }, [eth_pubkey])

  // handle eth wallet connect
  const handleEthPubkey = (eth_pubkey: string, throwaway: ThrowawayWallet) => {
    if (eth_pubkey == '') {
      setSignatureState(false)
      handleHsDetails(initialAmountDetails, 'not_fetched_yet')
      setSigDetails(initialSigDetails)
    }
    setEthPubkey(eth_pubkey)
    setThrowawayPubkey(throwaway)
  }
  // handle solana wallet connect
  const handleSolPubkey = (sol_pubkey: string) => {
    // set pubkey
    setSolPubkey(sol_pubkey)
  }

  // sets state of throwaway wallet signature verification
  const handleSigModal = async () => {
    setModalState(true)
  }

  // set headstash details into state. Used when wallets connect and disconnect
  const handleHsDetails = (amountDetails: HeadstashAllocation, state: FetchAmountState) => {
    setAmountDetails(amountDetails)
    setAmountState(state)
  }

  // fetch headstash data
  useEffect(() => {
    const retrieveThrowaway = async () => {
      let wallet = await WalletService.getLocalStorageMnemonicLOL(`throwawayPrivateKey-${eth_pubkey.slice(10)}`)
      let throwaway: ThrowawayWallet = {
        mnemonic: wallet.mnemonic,
        pubkey: wallet.address
      }
      setThrowawayPubkey(throwaway)
    }
    const fetchHeadstash = async (pubkey: string) => {
      try {
        if (String(pubkey).startsWith('0x1') && !eth_pubkey) {
          toast.error('eth_pubkey is required')
          return
        } else if (!eth_pubkey && !sol_pubkey) {
          toast.error('sol_pubkey is required')
        }

        setLoading(true)
        const headstashDetailsAPI = `http://localhost:3001/getHeadstash/${pubkey}`

        const amounts = await fetch(headstashDetailsAPI)
        if (amounts.ok) {
          const result = await amounts.json()
          handleHsDetails(result, 'amounts_fetched')
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

    if (eth_pubkey) {
      fetchHeadstash(eth_pubkey).then(() => {
        handleSigModal().then(() => {})
      })
    }

    if (sol_pubkey != '' && amountState == 'not_fetched_yet') {
      fetchHeadstash(sol_pubkey).then(() => {
        handleSigModal().then(() => {})
      })
    }

    if (exporting_mnemonic) {
      retrieveThrowaway()
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

      if (!amountDetails.headstash.length) {
        throw new Error('Not eligible for this headstash')
      }

      // define the msg to sign
      if (walletAddress !== undefined) {
        const cosmosAddress = walletAddress.toString()
        let throwaway = createThrowawayAccount(eth_pubkey)
        const from = eth_pubkey

        const msg = `0x${Buffer.from(`HREAM ~ ${throwaway.address} ~ ${cosmosAddress}`, 'utf8').toString('hex')}`

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
        setSigDetails(sign)
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

  // get solana wallet provider from browser
  const getSolProvider = () => {
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
      const provider = getSolProvider()
      if (!provider) {
        console.error('Phantom wallet not found')
      } else {
        await provider.connect()
      }
      handleSolPubkey(provider.publicKey)
      // get throwaway wallet
      let wallet = await WalletService.getLocalStorageMnemonicLOL(provider.publicKey)
      let throwaway: ThrowawayWallet = {
        mnemonic: wallet.mnemonic,
        pubkey: wallet.address
      }
      setThrowawayPubkey(throwaway)
      setModalState(true)
    } catch (error) {
      console.error(error)
    }
  }

  const generateAndSignPayload = async (provider: any) => {
    // generate throwaway wallet
    let throwaway = createThrowawayAccount(sol_pubkey)

    if (amountDetails.headstash.length == 0) {
      toast.error('Not eligible for this headstash')
      throw new Error('Not eligible!')
    }

    // form solana msg to sign
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
    setSigDetails(sig)
    setSigDetails(sig)
    return sig
  }

  const handleSolanaDisconnect = async () => {
    // get solana wallet provider from browser
    const provider = getSolProvider()
    try {
      await provider.disconnect()
      // Update state to reflect disconnect
      setSolPubkey('')
      setAmountDetails(initialAmountDetails)
      setAmountState('not_fetched_yet')
      setSigDetails(initialSigDetails)
    } catch (error) {
      console.error('Error disconnecting from Phantom wallet', error)
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

      if (sigDetails.signatureHash != '' && amountState == 'amounts_fetched') {
        const claim = { eth_pubkey, eth_sig: sigDetails.signatureHash, heady_wallet: walletAddress }

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

  const handleIbcBloomMsg = async () => {
    try {
      // confirm should be sending ibc-bloom

      // generate new eth sig

      // get throwaway wallet
      const { secretjs: importedSecretjs } = await WalletService.connectWallet(
        'throwaway', // grabs throwaway mnemonic from localstorage
        apiUrl,
        SECRET_TESTNET_CHAIN_ID
      )
      setSecretjs(importedSecretjs)

      if (eth_pubkey) {
        handleEthSig()
      }
      if (sol_pubkey) {
        handleSolanaSig()
      }

      // sign ibc_bloom msgs
      const ibc_bloom = {
        eth_pubkey,
        eth_sig: sigDetails.signatureHash,
        walletAddress,
        amountDetails: amountDetails.headstash
      }
      const msgExecute = new MsgExecuteContract({
        sender: secretjs.address,
        contract_address: headstashContract,
        code_hash: codeHash,
        msg: toUtf8(JSON.stringify(ibc_bloom)),
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
      <div className="max-w-md mx-auto px-6 text-neutral-600 dark:text-neutral-400 leading-7 text-justify">
        {/* Title */}
        <Carousel setApi={setApi}>
          <CarouselContent>
            {modal_state && (
              <Modal
                title="Confirm Throwaway Wallet"
                size="2xl"
                onClose={() => {
                  setModalState(false)
                }}
                isOpen={modal_state}
              >
                <p>Are you sure you are you want to proceed using {throwaway_pubkey.pubkey.substring(0, 10)}?</p>
                <button
                  className="text-white block my-6 p-3 w-full text-center font-semibold bg-cyan-600 dark:bg-cyan-600 rounded-lg text-sm hover:bg-cyan-500 dark:hover:bg-cyan-500 focus:bg-cyan-600 dark:focus:bg-cyan-600 transition-colors"
                  onClick={() => {
                    setModalState(false)
                    if (eth_pubkey) {
                      handleEthSig()
                    } else if (sol_pubkey) {
                      const provider = getSolProvider()
                      generateAndSignPayload(provider)
                    }
                  }}
                >
                  Confirm
                </button>
                <button
                  className="dark:bg-neutral-800 dark:text-neutral-400 dark:hover:text-white  text-xs bg-neutral-100 hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-colors py-2 px-2.5 rounded-xl"
                  onClick={() => {
                    let mnemonic = Buffer.from(throwaway_pubkey.mnemonic).toString('base64')
                    navigator.clipboard.writeText(mnemonic)
                    setModalState(false)
                  }}
                >
                  Export Current Mnemonic
                </button>
              </Modal>
            )}
            <CarouselItem className="basis">
              <Title title={'1. Connect Wallets'} />
              <center>
                <div className="text-neutral-400 dark:text-neutral-500 text-sm font-semibold mb-0.5">
                  First, we need to generate an offline signature from Metamask or Phantom. This signature does not
                  require any gas payments, does not interact, grant authorization or involve funds held by the
                  accounts, and verifies only you can claim your private headstash.
                </div>
                <br />
                <Wallet />

                {!sol_pubkey && walletAddress && <MetamaskConnectButton handleEthPubkey={handleEthPubkey} />}
                {!eth_pubkey && walletAddress && (
                  <div>
                    <div className="text-neutral-400 dark:text-neutral-500 text-sm font-semibold mb-0.5">or</div>
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
                          <span>Connect Phantom Wallet</span>
                        )}
                      </button>
                    )}
                  </div>
                )}
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
            {sigDetails && (
              <CarouselItem>
                {' '}
                <Title title={'3. IBC Bloom '} />
                <center>
                  <div className="text-neutral-400 dark:text-neutral-500 text-sm font-semibold mb-0.5"></div>
                  <button
                    className="text-white block my-6 p-3 w-full text-center font-semibold bg-cyan-600 dark:bg-cyan-600 rounded-lg text-sm hover:bg-cyan-500 dark:hover:bg-cyan-500 focus:bg-cyan-600 dark:focus:bg-cyan-600 transition-colors"
                    onClick={handleIbcBloomMsg}
                    style={{ filter: unEncryptedEthSig ? 'none' : 'blur(5px)' }}
                    disabled={!walletAddress || !isConnected || !eth_pubkey || !unEncryptedEthSig}
                  >
                    IBC Bloom
                  </button>
                </center>
              </CarouselItem>
            )}
          </CarouselContent>
          <CarouselPrevious />
          <CarouselNext />
        </Carousel>
        <br />
        <HeadstashApiTable amount={amountDetails} status={sigDetails} />
      </div>
    </>
  )
}

export default Headstash
