import { Helmet } from 'react-helmet-async'
import { bridgeJsonLdSchema, bridgePageDescription, headstashPageTitle, randomPadding } from 'utils/commons'
import { useSecretNetworkClientStore } from 'store/secretNetworkClient'
import { useEffect, useState, useContext } from 'react'
import toast from 'react-hot-toast'
import mixpanel from 'mixpanel-browser'
import { trackMixPanelEvent } from 'utils/commons'
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
import { useHeadstash } from 'hooks/useHeadstash'
import { Nullable } from 'types/Nullable'
import { WalletService } from 'services/wallet.service'
import { SECRET_TESTNET_CHAIN_ID, SECRET_TESTNET_LCD } from 'utils/config'
import { ApiStatus } from 'types/ApiStatus'
import { createAccountObject } from 'components/Headstash/Account'
import {
  Carousel,
  CarouselApi,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious
} from 'components/UI/carousel'
import { Progress } from 'components/UI/progress'
import { convertMicroDenomToDenomWithDecimals } from 'utils/tokens'

interface SigDetails {
  message: string
  signatureHash: any
  address: string
  timestamp: string
}

interface AmountDetailsRes {
  amount: string
  index: any
  proofs: string[]
}
const initialAmountDetails: AmountDetailsRes = {
  amount: '',
  index: null,
  proofs: ['']
}
const initialSigDetails: SigDetails = {
  message: '',
  signatureHash: null,
  address: '',
  timestamp: ''
}

function Headstash() {
  // network config state
  const [chainId, setChainId] = useState<string>('')
  const [secretjs, setSecretjs] = useState<Nullable<SecretNetworkClient>>(null)
  const [apiUrl, setApiUrl] = useState<string>(SECRET_TESTNET_LCD)
  const [apiStatus, setApiStatus] = useState<ApiStatus>('loading')
  const [gasPrice, setGasPrice] = useState<string>('')
  // app config state
  // const { theme } = useContext(ThemeContext)
  // const isClient = useIsClient()

  const [isVerified, setIsVerified] = useState(false)
  const [isloading, setLoading] = useState(false)
  const { walletAddress, walletPubkey, walletAPIType, isConnected } = useSecretNetworkClientStore()
  // eth pubkey state
  const [eth_pubkey, setEthPubkey] = useState('')
  const [ethSigDetails, setEthSigDetails] = useState<SigDetails>(initialSigDetails)
  // airdrop amount state
  const [amountDetails, setAmountDetails] = useState<AmountDetailsRes>(initialAmountDetails)
  const [amountState, setAmountState] = useState<FetchAmountState>('not_fetched_yet')
  type FetchAmountState = 'loading' | 'no_allocation' | 'amounts_fetched' | 'not_fetched_yet'

  // scrt-20 contract definitions
  const ibcSecretThiolContract = 'secret1umh28jgcp0g9jy3qc29xk42kq92xjrcdfgvwdz'
  const ibcSecretTerpContract = 'secret1c3lj7dr9r2pe83j3yx8jt5v800zs9sq7we6wrc'
  const codeHash = 'e401bf5f5797ebc2fc75a60cefb7e8ebf6a005a5a3af540a47221dc3c1dabe6f'
  const headstashContract = 'secret1le5q4htk5c2fs627xzxclfcdts63wwvyp8nj4e'

  // temporary client for testing signing key, will migrate to use secretNetworkClient
  const txEncryptionSeed = EncryptionUtilsImpl.GenerateNewSeed()

  const [api, setApi] = useState<CarouselApi>()

  useEffect(() => {
    const handleWalletDisconnect = () => {
      setEthPubkey('')
      handleHsDetails({
        amount: '',
        index: null,
        proofs: []
      })
      setEthPubkey('')
      // setProofsState('not_fetched_yet')
      // resetProofs()
    }
    // Check if window.ethereum is available
    if (eth_pubkey != '') {
      // Listen for wallet disconnect events
      ;(window as any).ethereum.on('disconnect', handleWalletDisconnect)
    }

    // clean event listener on unmount
    return () => {
      if (eth_pubkey != '') {
        ;(window as any).ethereum.off('disconnect', handleWalletDisconnect)
        // resetProofs();
      }
    }
  }, [])

  // set eth_pubkey
  const handleEthPubkey = (eth_pubkey: string) => {
    setEthPubkey(eth_pubkey)
  }
  // set headstash detials
  const handleHsDetails = (amountDetails: AmountDetailsRes) => {
    setAmountDetails(amountDetails)
    setAmountState('amounts_fetched')
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

          handleHsDetails(result)
          setAmountState('amounts_fetched')
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
      // ensure metamask is connected
      if (!isConnected || !eth_pubkey) {
        toast.error(
          ' Unable to sign verification message. Please make sure both Metamask & the desired interchain wallet is connected.'
        )
        return
      }
      // connected cosmos wallet gets added into message to be signed
      if (walletAddress !== undefined) {
        const cosmosAddress: string = walletAddress.toString()
        const from = eth_pubkey
        // define the msg being signed by Metamask
        const msg = `0x${Buffer.from(cosmosAddress, 'utf8').toString('hex')}`
        // sign the msg
        const sign = await (window as any).ethereum.request({
          method: 'personal_sign',
          params: [msg, from]
        })
        const sig = {
          message: cosmosAddress,
          signatureHash: sign,
          address: from,
          timestamp: new Date().toISOString()
        }
        setEthSigDetails(sig)
        setIsVerified(true)
        console.log(sig)
      } else {
        toast.error('Error Updating ethSig.')
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

  // TODO: get randomness from nois
  const entropy = 'eretskeretjableret'

  async function claimHeadstashMsg() {
    try {
      // const secretjsquery = new SecretNetworkClient({
      //   url: apiUrl,
      //   chainId: ''
      // })
      // const { block } = await secretjsquery.query.tendermint.getLatestBlock({})
      // let minimum_gas_price: string | undefined
      // try {
      //   ; ({ minimum_gas_price } = await secretjsquery.query.node.config({}))
      // } catch (error) { }

      // const newChainId = block?.header?.chain_id!

      // let newGasPrice: string | undefined
      // if (minimum_gas_price) {
      //   newGasPrice = minimum_gas_price.replace(/0*([a-z]+)$/, '$1')
      // }
      // console.log(minimum_gas_price)

      const { secretjs: importedSecretjs } = await WalletService.connectWallet(
        walletAPIType,
        apiUrl,
        SECRET_TESTNET_CHAIN_ID
      )
      setSecretjs(importedSecretjs)
      setChainId(SECRET_TESTNET_CHAIN_ID)
      setApiStatus('online')
      setGasPrice('0.1')

      if (ethSigDetails.signatureHash != '' && amountState == 'amounts_fetched') {
        const claim = createAccountObject(eth_pubkey, ethSigDetails.signatureHash)
        // console.log(account)

        const msgExecute = new MsgExecuteContract({
          sender: walletAddress,
          contract_address: headstashContract,
          code_hash: codeHash,
          msg: toUtf8(JSON.stringify(claim)),
          sent_funds: []
        })
        // console.log(msgExecute)
        // const sim = await secretjs.tx.simulate([msgExecute])
        const tx = await secretjs.tx.broadcast([msgExecute], {
          gasLimit: Math.ceil(parseInt('2000000') * 2),
          gasPriceInFeeDenom: parseInt('0.1')
        })
        //   assertIsDeliverTxSuccess(tx);
        console.log('Execution Result:', tx.transactionHash)
        toast.success(`[View Tx Hash](https://ping.pub/terp/tx/${tx.transactionHash})`)
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

  async function handleCreateViewingKey() {
    try {
      const { secretjs: importedSecretjs } = await WalletService.connectWallet(
        walletAPIType,
        apiUrl,
        SECRET_TESTNET_CHAIN_ID
      )
      setSecretjs(importedSecretjs)
      setChainId(SECRET_TESTNET_CHAIN_ID)
      setApiStatus('online')
      setGasPrice('0.1')

      let handleMsg = { create_viewing_key: { entropy: entropy } }
      console.log('Creating viewing key')
      const txExec = await secretjs.tx.snip20.createViewingKey(
        {
          sender: secretjs.address,
          contract_address: ibcSecretTerpContract,
          code_hash: codeHash,
          msg: handleMsg
        },
        {
          gasLimit: Math.ceil(50000 * 2),
          gasPriceInFeeDenom: parseInt('0.1')
        }
      )
      console.log(txExec)
    } catch (error) {
      let errorMessage: string
      if (error instanceof Error) {
        errorMessage = error.message
      } else {
        errorMessage = JSON.stringify(error)
        console.log(errorMessage)
      }

      setApiStatus('offline')
      setGasPrice('')
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
        <Title title={'Private Headstash Airdrop'} />
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
                  style={{ filter: ethSigDetails.signatureHash ? 'none' : 'blur(5px)' }}
                  disabled={!walletAddress || !isConnected || !eth_pubkey || !ethSigDetails.signatureHash}
                >
                  Claim Headstash Airdrop
                </button>
              </center>
            </CarouselItem>
          </CarouselContent>
          <CarouselPrevious />
          <CarouselNext />
        </Carousel>
        <br />
        <div className="rounded-xl bg-white border border-neutral-200 dark:border-neutral-700 dark:bg-neutral-800 h-full flex items-center px-4 py-2">
          <div className="flex-1">
            <div className="text-center inline-block">
              Headstash Details
              <div className="text-neutral-400 dark:text-neutral-500 text-sm font-semibold mb-0.5"> Address:</div>
              <div className="text-neutral-400 dark:text-neutral-500 text-sm font-semibold mb-0.5"> Amount:</div>
              <div className="text-neutral-400 dark:text-neutral-500 text-sm font-semibold mb-0.5">
                Signed:{' '}
                {ethSigDetails && ethSigDetails !== initialSigDetails ? (
                  <span style={{ color: 'green' }}>✓</span>
                ) : (
                  <span style={{ color: 'red' }}>x</span>
                )}
              </div>
              <div className="text-xl"></div>
            </div>
          </div>
          <div className="flex-1 text-right">
            {eth_pubkey}
            {eth_pubkey !== '' && <p> {convertMicroDenomToDenomWithDecimals(amountDetails.amount, 6)}</p>}
          </div>
        </div>
        <div>{/* {ethSigDetails !== null && <p>eth_sig: {ethSigDetails.signatureHash}</p>} */}</div>
      </div>
    </>
  )
}

export default Headstash
