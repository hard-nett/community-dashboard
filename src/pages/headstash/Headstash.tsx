import { Helmet } from 'react-helmet-async'
import { bridgeJsonLdSchema, bridgePageDescription, headstashPageTitle, randomPadding } from 'utils/commons'
import mixpanel from 'mixpanel-browser'
import { useEffect, useState, useContext } from 'react'
import { trackMixPanelEvent } from 'utils/commons'
import { ThemeContext } from 'context/ThemeContext'
import { useSecretNetworkClientStore } from 'store/secretNetworkClient'
import { useIsClient } from 'hooks/useIsClient'
import Title from 'components/Title'
import MetamaskConnectButton from 'components/Wallet/metamask-connect-button'
import toast from 'react-hot-toast'
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

interface SigDetails {
  message: string
  signatureHash: any
  address: string
  timestamp: string
}

const initialSigDetails: SigDetails = {
  message: '',
  signatureHash: null,
  address: '',
  timestamp: ''
}

function Headstash() {
  const [chainId, setChainId] = useState<string>('')
  const [secretjs, setSecretjs] = useState<Nullable<SecretNetworkClient>>(null)
  const [apiUrl, setApiUrl] = useState<string>(SECRET_TESTNET_LCD)
  const [gasPrice, setGasPrice] = useState<string>('')
  const [apiStatus, setApiStatus] = useState<ApiStatus>('loading')
  const { theme } = useContext(ThemeContext)
  const isClient = useIsClient()
  const [isVerified, setIsVerified] = useState(false)
  const [isloading, setLoading] = useState(false)
  const { walletAddress, walletAPIType, isConnected, secretNetworkClient, setViewingKey } =
    useSecretNetworkClientStore()

  const [eth_pubkey, setEthPubkey] = useState('')
  const [ethSigDetails, setEthSigDetails] = useState<SigDetails>(initialSigDetails)
  // airdrop amount state
  const [amount, setAmount] = useState('')
  type FetchAmountState = 'loading' | 'no_proofs' | 'amounts_fetch' | 'not_fetched_yet'
  const [amountState, setAmountState] = useState<FetchAmountState>('not_fetched_yet')

  const formattedTerpAmount = `${amount.slice(0, 5)}.${amount.slice(5)} $TERP`
  const formattedThiolAmount = `${amount.slice(0, 5)}.${amount.slice(5)} $THIOL`
  // proof state
  const [proofs, setProofs] = useState<string[]>([''])
  type FetchProofState = 'loading' | 'no_proofs' | 'proofs_fetched' | 'not_fetched_yet'
  const [proofState, setProofsState] = useState<FetchProofState>('not_fetched_yet')

  // scrt-20 contract definitions
  const ibcSecretThiolContract = 'secret1umh28jgcp0g9jy3qc29xk42kq92xjrcdfgvwdz'
  const ibcSecretTerpContract = 'secret1c3lj7dr9r2pe83j3yx8jt5v800zs9sq7we6wrc'
  const codeHash = 'c74bc4b0406507257ed033caa922272023ab013b0c74330efc16569528fa34fe'
  const headstashContract = ''

  // temporary client for testing signing key, will migrate to use secretNetworkClient
  const txEncryptionSeed = EncryptionUtilsImpl.GenerateNewSeed()

  useEffect(() => {
    const handleWalletDisconnect = () => {
      setEthPubkey('')
      handleAmount('')
      setEthPubkey('')
      console.log(proofState)
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
  const handleAmount = (amount: string) => {
    setAmount(amount)
    setAmountState('not_fetched_yet')
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

        const headstashAmountAPI = `http://localhost:3001/getAmount/${eth_pubkey}`
        const headstashProofAPI = `http://localhost:3001/getProofs/${eth_pubkey}`

        // GET request for amounts
        const amounts = await fetch(headstashAmountAPI)

        if (amounts.ok) {
          const result = await amounts.json()
          const { amount } = result
          setAmountState('amounts_fetch')
          setAmount(amount)
        } else {
          console.error('cannot get headstash amounts:', amounts.status)
        }
        // GET request for proofs
        const proofsResponse = await fetch(headstashProofAPI)
        if (proofsResponse.ok) {
          const result = await proofsResponse.json()
          console.log('Headstash Proofs:', result)
          setProofs(result)
          setProofsState('proofs_fetched')
        } else {
          console.error('Proofs request failed with status:', proofsResponse.status)
        }

        // Reset loading state
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

  async function createPrivateAccountMsg() {
    try {
      const secretjsquery = new SecretNetworkClient({
        url: apiUrl,
        chainId: ''
      })
      const { block } = await secretjsquery.query.tendermint.getLatestBlock({})
      let minimum_gas_price: string | undefined
      try {
        ;({ minimum_gas_price } = await secretjsquery.query.node.config({}))
      } catch (error) {}

      const newChainId = block?.header?.chain_id!

      let newGasPrice: string | undefined
      if (minimum_gas_price) {
        newGasPrice = minimum_gas_price.replace(/0*([a-z]+)$/, '$1')
      }
      console.log(minimum_gas_price)

      const { walletAddress, secretjs: importedSecretjs } = await WalletService.connectWallet(
        walletAPIType,
        apiUrl,
        newChainId
      )

      let handleMsg = {
        account: {
          addresses: [
            {
              params: {
                coins: [{}],
                contract: '',
                eth_pubkey: eth_pubkey,
                execute_msg: {},
                sender: ''
              },
              signature: {
                pub_key: {},
                signature: ''
              }
            }
          ],
          eth_pubkey: eth_pubkey
        }
      }

      const msgExecute = new MsgExecuteContract({
        sender: walletAddress,
        contract_address: '', // secret testnet
        code_hash: '',
        msg: toUtf8(JSON.stringify(handleMsg)),
        sent_funds: []
      })
      const sim = await secretjs.tx.simulate([msgExecute])
      const tx = await secretjs.tx.broadcast([msgExecute], {
        gasLimit: Math.ceil(parseInt(sim.gas_info.gas_used) * 2),
        gasPriceInFeeDenom: parseInt(minimum_gas_price)
      })
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
  const resetProofs = () => {
    setProofs([''])
  }

  const claimHeadstashMsg = async () => {
    try {
      // ensure keplr is connected
      if (!walletAddress || !isConnected) {
        console.error('Wallets not connected not connected')
        return
      }
      if (!amount) {
        toast.error('Invalid amount value')
        console.error("Invalid 'amount' value:", amount)
        return
      }
      const executeMsg = {
        claim: {
          amount: amount,
          eth_pubkey: eth_pubkey,
          eth_sig: ethSigDetails ? ethSigDetails.signatureHash.slice(2) : '', // this removes the '0x' prefix
          proof: proofs
        }
      }

      const msgExecute = new MsgExecuteContract({
        sender: walletAddress,
        contract_address: '', // secret testnet
        code_hash: '',
        msg: toUtf8(JSON.stringify(executeMsg)),
        sent_funds: []
      })
      const sim = await secretjs.tx.simulate([msgExecute])
      const tx = await secretjs.tx.broadcast([msgExecute], {
        gasLimit: Math.ceil(parseInt(sim.gas_info.gas_used) * 1.1)
      })

      //   assertIsDeliverTxSuccess(tx);
      console.log('Execution Result:', tx.transactionHash)
      toast.success(`[View Tx Hash](https://ping.pub/terp/tx/${tx.transactionHash})`)
    } catch (error) {
      toast.error(`Claim Headstash Error: ${error}`)
      console.error('Execution Error:', error)
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
        <Title title={'1. Connect Wallets'} />
        <center>
          <MetamaskConnectButton handleEthPubkey={handleEthPubkey} />
          <br />
          <Wallet />
        </center>
        <div>
          <br />
          <h1>Headstash Details</h1>
          <p>Address: {eth_pubkey}</p>
          {eth_pubkey !== '' && <p>Amount: {amount}</p>}
        </div>
        <div style={{ filter: isConnected && eth_pubkey ? 'none' : 'blur(5px)' }}>
          <Title title={'2. Create Signing Key'} />
          <button
            className="text-white block my-6 p-3 w-full text-center font-semibold bg-cyan-600 dark:bg-cyan-600 rounded-lg text-sm hover:bg-cyan-500 dark:hover:bg-cyan-500 focus:bg-cyan-600 dark:focus:bg-cyan-600 transition-colors"
            onClick={handleCreateViewingKey}
          >
            Create Signing Keys
          </button>
          <Title title={'3. Verify Ownership'} />
          <button
            className="text-white block my-6 p-3 w-full text-center font-semibold bg-cyan-600 dark:bg-cyan-600 rounded-lg text-sm hover:bg-cyan-500 dark:hover:bg-cyan-500 focus:bg-cyan-600 dark:focus:bg-cyan-600 transition-colors"
            onClick={handleEthSig}
            style={{ filter: isConnected ? 'none' : 'blur(5px)' }}
            disabled={!walletAddress || !isConnected || !eth_pubkey || isVerified}
          >
            Sign & Verify
          </button>
          <Title title={'4. Create Private Account'} />
          <button
            className="text-white block my-6 p-3 w-full text-center font-semibold bg-cyan-600 dark:bg-cyan-600 rounded-lg text-sm hover:bg-cyan-500 dark:hover:bg-cyan-500 focus:bg-cyan-600 dark:focus:bg-cyan-600 transition-colors"
            onClick={createPrivateAccountMsg}
          >
            Create Private Account
          </button>
          <Title title={'5. Claim Headstash'} />
          <button
            className="text-white block my-6 p-3 w-full text-center font-semibold bg-cyan-600 dark:bg-cyan-600 rounded-lg text-sm hover:bg-cyan-500 dark:hover:bg-cyan-500 focus:bg-cyan-600 dark:focus:bg-cyan-600 transition-colors"
            onClick={claimHeadstashMsg}
          >
            Claim Your Headstash, Privately
          </button>

          {/* <Title title={'5. Choose Next Steps'} /> */}
        </div>
      </div>
    </>
  )
}

export default Headstash
