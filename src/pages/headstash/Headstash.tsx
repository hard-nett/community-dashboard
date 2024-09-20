import { Helmet } from 'react-helmet-async'
import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'

import { bridgeJsonLdSchema, bridgePageDescription, headstashPageTitle, randomPadding } from 'utils/commons'
import { useSecretNetworkClientStore } from 'store/secretNetworkClient'

import { useIsClient } from 'hooks/useIsClient'
import Title from 'components/Title'
import MetamaskConnectButton from 'components/Wallet/metamask-connect-button'
import Wallet from 'components/Wallet/Wallet'
import { MsgExecuteContract, SecretNetworkClient, toUtf8 } from 'secretjs'
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
import { codeHash, feegrantAddress, headstashContract } from 'utils/headstash'
import { getShortAddress, getShortTxHash } from 'utils/getShortAddress'
import Modal from '@/components/UI/Modal/Modal'
import FeegrantButton from 'components/FeeGrant/components/ActionableStatus'
import {
  HeadstashAllocation,
  HeadstashItem,
  initialAmountDetails,
  initialSigDetails,
  initialThrowawayDetails,
  SigDetails,
  ThrowawayWallet
} from '@/types/Headstash'
import BloomForm from './components/BloomForm'
import HeadstashAPITable from './components/HeadstashTable'
// import init, * as ecies from 'ecies-wasm'

function Headstash() {
  // network config state
  const [secretjs, setSecretjs] = useState<Nullable<SecretNetworkClient>>(null)
  const [apiUrl, setApiUrl] = useState<string>(SECRET_TESTNET_LCD)
  const [isloading, setLoading] = useState(false)
  const {
    walletAddress,
    walletAPIType,
    isConnected,
    unEncryptedOfflineSig,
    setUnEncryptedOfflineSig,
    setAmountDetails,
    amountDetails,
    solPubkey,
    setSolPubkey,
    feeGrantStatus
  } = useSecretNetworkClientStore()
  // pubkey states (eth, sol)
  const [ethPubkey, setEthPubkey] = useState('')
  const [exporting_mnemonic, setExportingMnemonic] = useState(false)
  const [modal_state, setModalState] = useState(false)
  const [gen_sig, setSignatureState] = useState(false)
  const [throwaway_pubkey, setThrowawayPubkey] = useState<ThrowawayWallet>(initialThrowawayDetails)
  const [sigDetails, setSigDetails] = useState<SigDetails>(initialSigDetails)
  // airdrop amount state
  const [amountState, setAmountState] = useState<FetchAmountState>('not_fetched_yet')
  type FetchAmountState = 'loading' | 'no_allocation' | 'amounts_fetched' | 'not_fetched_yet'
  // feegrant state

  const [api, setApi] = useState<CarouselApi>()

  // handle eth wallet connect
  const handleEthPubkey = async (ethPubkey: string) => {
    setEthPubkey(ethPubkey)
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

  // handle solana wallet connect
  const handleSolPubkey = (solPubkey: string) => {
    // set pubkey
    setEthPubkey(null)
    setSolPubkey(solPubkey)
  }

  // triggers the throwaway wallet modal
  const handleSigModal = async () => {
    setModalState(true)
  }

  function getPubkey() {
    return ethPubkey !== null ? ethPubkey : solPubkey
  }

  const fetchThrowawayKeys = async () => {
    // get or create throwaway keyring, with pubkey
    let now = new Date()
    let monthAndDate = now.toLocaleString('default', { month: 'numeric', day: 'numeric' })
    console.log(monthAndDate)

    let lsKey = `hstk-${monthAndDate}-${getPubkey()}`
    let wallet = await WalletService.getLocalStorageMnemonicLOL(lsKey)
    let throwaway: ThrowawayWallet = {
      mnemonic: wallet.mnemonic,
      pubkey: wallet.address
    }
    setThrowawayPubkey(throwaway)
  }

  useEffect(() => {
    if (isloading) {
      const handleFetchingThrowawayKeys = async () => {
        await fetchThrowawayKeys()
      }
      handleFetchingThrowawayKeys()
    }
  }, [isloading])

  // wallet specific effects
  useEffect(() => {
    // reset state when wallet disconnects
    const handleWalletDisconnect = () => {
      setEthPubkey('')
      setSolPubkey('')
      setSignatureState(false)
      handleHsDetails(initialAmountDetails, 'not_fetched_yet')
      setSigDetails(initialSigDetails)
      setUnEncryptedOfflineSig('')
    }
    // Check if window.ethereum is available
    if (ethPubkey != '') {
      // Listen for wallet disconnect events
      ;(window as any).ethereum.on('disconnect', handleWalletDisconnect)
    } else if (solPubkey != '') {
      // Listen for solana wallet disconnect events
      ;(window as any).solana.on('disconnect', handleWalletDisconnect)
    }

    // clean event listener on unmount
    return () => {
      if (ethPubkey != '') {
        ;(window as any).ethereum.off('disconnect', handleWalletDisconnect)
      } else if (solPubkey != '') {
        ;(window as any).solana.off('disconnect', handleWalletDisconnect)
      }
    }
  }, [ethPubkey, solPubkey])

  const handleHsDetails = (amountDetails: HeadstashAllocation, state: FetchAmountState) => {
    setAmountDetails(amountDetails)
    setAmountState(state)
  }

  // headstash specific effects
  useEffect(() => {
    const fetchHeadstash = async (pubkey: string) => {
      try {
        if (String(pubkey).startsWith('0x1') && !ethPubkey) {
          toast.error('ethPubkey is required')
          return
        } else if (!ethPubkey && !solPubkey) {
          toast.error('solPubkey is required')
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

    if (ethPubkey) {
      fetchHeadstash(ethPubkey).then(() => {
        handleSigModal().then(() => {})
      })
    }
    if (solPubkey != '' && amountState == 'not_fetched_yet') {
      fetchHeadstash(solPubkey).then(() => {
        handleSigModal().then(() => {})
      })
    }
  }, [ethPubkey, solPubkey])

  // create eth sig
  const handleEthSig = async () => {
    try {
      if (!isConnected || !ethPubkey) {
        toast.error(
          'Unable to sign verification message. Please ensure both Metamask & the desired interchain wallet are connected.'
        )
        return
      }

      if (!amountDetails.headstash.length) {
        throw new Error('Not eligible for this headstash')
      }

      if (walletAddress !== undefined) {
        const cosmosAddress = walletAddress.toString()
        await fetchThrowawayKeys()
        const from = ethPubkey

        // define the msg to sign
        const msg = `0x${Buffer.from(`HREAM ~ ${throwaway_pubkey.pubkey} ~ ${cosmosAddress}`, 'utf8').toString('hex')}`

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
        // let hash = await encrypt_sig(sig.signatureHash)
        // setEncryptedOfflineSig(hash)

        // set values to local-storage
        setSigDetails(sig)
      } else {
        toast.error('Error Updating ethSig.')
      }
    } catch (error) {
      console.error('Error during handleEthSig:', error)
      let errorMessage = error instanceof Error ? error.message : JSON.stringify(error)
      toast.error(errorMessage)
    }
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
      fetchThrowawayKeys()
      setModalState(true)
    } catch (error) {
      console.error(error)
    }
  }

  const signSol = async (provider: any) => {
    // generate throwaway wallet
    await fetchThrowawayKeys()

    if (amountDetails.headstash.length == 0) {
      toast.error('Not eligible for this headstash')
      throw new Error('Not eligible!')
    }

    // form solana msg to sign
    const cosmosAddress = walletAddress.toString()
    const messageBytes = Buffer.from(`HREAM ~ ${throwaway_pubkey.pubkey} ~ ${cosmosAddress}`, 'utf8')

    // sign the transaction using Phantom wallet (returns bytes)
    const payloadSignature = await provider.signMessage(messageBytes)

    // return expected sig response type
    const sig: SigDetails = {
      message: messageBytes.toString('base64'),
      signatureHash: payloadSignature.signature,
      address: payloadSignature.publicKey,
      timestamp: new Date().toISOString()
    }

    // let hash = await encrypt_sig(sig.signatureHash)
    // setEncryptedOfflineSig(hash)

    setSigDetails(sig)
    setUnEncryptedOfflineSig(sig.signatureHash)
    return sig
  }

  // const encrypt_sig = async (sig: string) => {
  //   // init ecies
  //   init();
  //   const encoder = new TextEncoder()
  //   // encrypt the request
  //   const encrypted = ecies.encrypt(encoder.encode(import.meta.env.ECIES_PUBKEY), encoder.encode(sig))
  //   let hash = Buffer.from(encrypted).toString('hex')
  //   return hash
  // }

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
      // setEncryptedOfflineSig('')
    } catch (error) {
      console.error('Error disconnecting from Phantom wallet', error)
    }
  }

  // sign msg to claim headstash with throwaway wallet, gas fees covered.
  const claimHeadstashMsg = async () => {
    try {
      const { secretjs: importedSecretjs } = await WalletService.connectWallet(
        'throwaway', // grabs throwaway mnemonic from localstorage
        apiUrl,
        SECRET_TESTNET_CHAIN_ID
      )
      setSecretjs(importedSecretjs)

      if (sigDetails.signatureHash != '' && amountState == 'amounts_fetched') {
        if (ethPubkey != '') {
        }
        if (solPubkey != '') {
        }
        // cw-headstash entry point
        const claim = { pubkey: getPubkey(), offline_sig: sigDetails.signatureHash, heady_wallet: walletAddress }

        // form msg to broadcast
        const msgExecute = new MsgExecuteContract({
          sender: secretjs.address,
          contract_address: headstashContract,
          code_hash: codeHash,
          msg: toUtf8(JSON.stringify(claim)),
          sent_funds: []
        })

        // broadcast
        const tx = await secretjs.tx.broadcast([msgExecute], {
          gasLimit: Math.ceil(parseInt('000000') * 2),
          gasPriceInFeeDenom: parseInt('0.05'),
          feeDenom: 'uscrt',
          feeGranter: feegrantAddress
        })

        // handle error
        if (tx.code == 0) {
          toast.success(`View Tx Hash: ${getShortTxHash(tx.transactionHash)}`)
        } else {
          toast.error(tx.rawLog)
        }
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
                    if (ethPubkey) {
                      handleEthSig()
                    } else if (solPubkey) {
                      const provider = getSolProvider()
                      signSol(provider)
                    }
                  }}
                >
                  Confirm
                </button>
                <button
                  className="dark:bg-neutral-800 dark:text-neutral-400 dark:hover:text-white  text-xs bg-neutral-100 hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-colors py-2 px-2.5 rounded-xl"
                  onClick={() => {
                    let mnemonic = Buffer.from(throwaway_pubkey.mnemonic).toString('base64')
                    navigator.clipboard.writeText(btoa(mnemonic))
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

                {!solPubkey && walletAddress && <MetamaskConnectButton handleEthPubkey={handleEthPubkey} />}
                {!ethPubkey && walletAddress && (
                  <div>
                    <div className="text-neutral-400 dark:text-neutral-500 text-sm font-semibold mb-0.5">or</div>
                    {solPubkey != '' ? (
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
                        {solPubkey.length > 0 ? (
                          `${solPubkey.substring(0, 6)}...${solPubkey.substring(38)}`
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
                  style={{ filter: unEncryptedOfflineSig ? 'none' : 'blur(5px)' }}
                  disabled={!walletAddress || !isConnected || !ethPubkey || !unEncryptedOfflineSig}
                >
                  Claim Headstash Airdrop
                </button>
                {feeGrantStatus == 'untouched' && (
                  <p className="text-neutral-400 dark:text-neutral-500 text-sm font-semibold mb-0.5">
                    <span className="select-none">
                      <FeegrantButton /> –{' '}
                    </span>
                    Bypass your first few transactions fees required on Secret Network.
                  </p>
                )}
              </center>
            </CarouselItem>
            {sigDetails && (
              <CarouselItem>
                {' '}
                <Title title={'3. IBC Bloom '} />
                <center>
                  <BloomForm />
                </center>
              </CarouselItem>
            )}
          </CarouselContent>
          <CarouselPrevious />
          <CarouselNext />
        </Carousel>
        <br />
        <HeadstashAPITable amount={amountDetails} status={sigDetails} />
      </div>
    </>
  )
}

export default Headstash
