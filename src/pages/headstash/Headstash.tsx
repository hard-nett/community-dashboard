import { Helmet } from 'react-helmet-async'
import {
  bridgeJsonLdSchema,
  bridgePageDescription,
  headstashPageTitle,
  randomPadding,
  trackMixPanelEvent
} from 'utils/commons'
import { useSecretNetworkClientStore } from 'store/secretNetworkClient'
import { useEffect, useState, useContext } from 'react'
import toast from 'react-hot-toast'
import { scrtToken } from 'utils/tokens'
import { ThemeContext } from 'context/ThemeContext'
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
import { createAccountObject } from 'components/Headstash/Account'
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
  codeHash,
  feegrantAddress,
  headstashContract,
  ibcSecretTerpContract,
  initialAmountDetails,
  initialSigDetails
} from 'utils/headstash'
import { getShortAddress, getShortTxHash } from 'utils/getShortAddress'
import ActionableStatus from 'components/FeeGrant/components/ActionableStatus'
import { encrypt } from 'eciesjs'
import crypto from 'crypto'
import encrypt_eth_signature from 'utils/ecies'
import { Link } from 'react-router-dom'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faShuffle } from '@fortawesome/free-solid-svg-icons'

function Headstash() {
  // network config state
  const [secretjs, setSecretjs] = useState<Nullable<SecretNetworkClient>>(null)
  const [apiUrl, setApiUrl] = useState<string>(SECRET_TESTNET_LCD)
  const [isVerified, setIsVerified] = useState(false)
  const [isloading, setLoading] = useState(false)
  const {
    walletAddress,
    walletAPIType,
    isConnected,
    getBalance,
    unEncryptedEthSig,
    setUnencryptedEthSig,
    feeGrantStatus
  } = useSecretNetworkClientStore()
  // eth pubkey state
  const [eth_pubkey, setEthPubkey] = useState('')
  const [ethSigDetails, setEthSigDetails] = useState<SigDetails>(initialSigDetails)
  const [encryptedEthSig, setEncryptedEthSig] = useState<Uint8Array>()
  // airdrop amount state
  const [amountDetails, setAmountDetails] = useState<AmountDetailsRes>(initialAmountDetails)
  const [amountState, setAmountState] = useState<FetchAmountState>('not_fetched_yet')
  type FetchAmountState = 'loading' | 'no_allocation' | 'amounts_fetched' | 'not_fetched_yet'
  // feegrant state
  type FeeGrantState = 'loading' | 'already_granted' | 'not_requested' | 'granted' | 'not_granted'

  // temporary client for testing signing key, will migrate to use secretNetworkClient
  const [api, setApi] = useState<CarouselApi>()

  useEffect(() => {
    const handleWalletDisconnect = () => {
      setEthPubkey('')
      handleHsDetails(initialAmountDetails, 'not_fetched_yet')
      setEthPubkey('')
    }
    // Check if window.ethereum is available
    if (eth_pubkey != '') {
      // Listen for wallet disconnect events
      ;(window as any).ethereum.on('disconnect', handleWalletDisconnect)
    }

    console.log(eth_pubkey)
    console.log('headstash detials:', amountDetails.amount)
    // clean event listener on unmount
    return () => {
      if (eth_pubkey != '') {
        ;(window as any).ethereum.off('disconnect', handleWalletDisconnect)
      }
    }
  }, [eth_pubkey])

  // set eth_pubkey
  const handleEthPubkey = (eth_pubkey: string) => {
    setEthPubkey(eth_pubkey)
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
    const fetchHeadstash = async () => {
      try {
        // Check if eth_pubkey exists
        if (!eth_pubkey) {
          toast.error('eth_pubkey is required')
          console.error('eth_pubkey is required')
          return
        }

        // Set loading state to true
        setLoading(true)
        const headstashDetailsAPI = `http://localhost:3001/getHeadstash/${eth_pubkey}`

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
      fetchHeadstash()
    }
  }, [eth_pubkey])

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

  const claimHeadstashMsg = async () => {
    try {
      const { secretjs: importedSecretjs } = await WalletService.connectWallet(
        walletAPIType,
        apiUrl,
        SECRET_TESTNET_CHAIN_ID
      )
      setSecretjs(importedSecretjs)

      if (ethSigDetails.signatureHash != '' && amountState == 'amounts_fetched') {
        const claim = { eth_pubkey, eth_sig: ethSigDetails.signatureHash }

        const msgExecute = new MsgExecuteContract({
          sender: walletAddress,
          contract_address: headstashContract,
          code_hash: codeHash,
          msg: toUtf8(JSON.stringify(claim)),
          sent_funds: []
        })

        const tx = await secretjs.tx.broadcast([msgExecute], {
          gasLimit: Math.ceil(parseInt('000000') * 2),
          gasPriceInFeeDenom: parseInt('0.05'),
          feeDenom: 'uscrt'
          // feeGranter: feegrantAddress
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
                <MetamaskConnectButton handleEthPubkey={handleEthPubkey} />
                <br />
                <div className="text-neutral-400 dark:text-neutral-500 text-sm font-semibold mb-0.5">Cosmos Wallet</div>
                <Wallet />
              </center>
            </CarouselItem>
            <CarouselItem className="basis">
              <Title title={'2. Verify Metamask Ownership'} />
              <center>
                <div className="text-neutral-400 dark:text-neutral-500 text-sm font-semibold mb-0.5">
                  Request an offline signature from Metamask of your public cosmos wallet address. This signature does
                  not require any gas payments, and verifies only you can claim your private headstash.
                </div>
                <button
                  className="text-white block my-6 p-3 w-full text-center font-semibold bg-cyan-600 dark:bg-cyan-600 rounded-lg text-sm hover:bg-cyan-500 dark:hover:bg-cyan-500 focus:bg-cyan-600 dark:focus:bg-cyan-600 transition-colors"
                  onClick={handleEthSig}
                  style={{ filter: eth_pubkey ? 'none' : 'blur(5px)' }}
                  disabled={!walletAddress || !isConnected || !eth_pubkey || isVerified}
                >
                  Sign & Verify
                </button>
              </center>
            </CarouselItem>
            <CarouselItem>
              {' '}
              <Title title={'3. Claim Headstash'} />
              <center>
                <div className="text-neutral-400 dark:text-neutral-500 text-sm font-semibold mb-0.5">
                  Claims your headstash privately. This requires your wallet to have SCRT tokens, to cover on-chain gas
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
                    <span className="inline-block bg-emerald-500 dark:bg-emerald-800 text-white py-0.5 px-1.5 rounded lowercase font-semibold text-neutral-400 dark:text-neutral-500 text-sm font-semibold mb-0.5">
                      Protip
                    </span>{' '}
                    –{' '}
                  </span>
                  Bypass your first few transactions fees required on Secret Network.
                </p>
                <ActionableStatus />
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
              {eth_pubkey !== '' && <p>{convertMicroDenomToDenomWithDecimals(amountDetails.amount, 6)}</p>}{' '}
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
