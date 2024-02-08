import { faArrowUpRightFromSquare, faShuffle } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { Link } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import {
  bridgeJsonLdSchema,
  bridgePageDescription,
  bridgePageTitle,
  formatNumber,
  headstashPageTitle,
  pageTitle,
  randomPadding
} from 'utils/commons'
import mixpanel from 'mixpanel-browser'
import { useEffect, useState, useContext } from 'react'
import { trackMixPanelEvent } from 'utils/commons'
import SquidModal from './SquidModal'
import { ThemeContext } from 'context/ThemeContext'
import HoudiniModal from './HoudiniModal'
import { useSecretNetworkClientStore } from 'store/secretNetworkClient'
import { useIsClient } from 'hooks/useIsClient'
import Title from 'components/Title'
import MetamaskConnectButton from 'components/Wallet/metamask-connect-button'
import { proofData, headstashData } from 'lib/headstash'
import toast from 'react-hot-toast'
import Wallet from 'components/Wallet/Wallet'
import Button from 'components/UI/Button/Button'
import { MsgExecuteContract, MsgExecuteContractResponse, toUtf8 } from 'secretjs'
import ProofComponent from 'components/Headstash/proof'

function Headstash() {
  useEffect(() => {
    trackMixPanelEvent('Open Bridge Tab')
  }, [])

  const { theme } = useContext(ThemeContext)
  const [eth_pubkey, setEthPubkey] = useState('')
  const [eth_sig] = useState('')
  const [amount, setAmount] = useState('')
  const [viewing_key, setViewingKey] = useState('')
  const formattedTerpAmount = `${amount.slice(0, 5)}.${amount.slice(5)} $TERP`
  const formattedThiolAmount = `${amount.slice(0, 5)}.${amount.slice(5)} $THIOL`
  const [proofs, setProofs] = useState<string[]>([''])
  const isClient = useIsClient()
  const [isVerified, setIsVerified] = useState(false)

  const { walletAddress, isConnected, secretNetworkClient, setSecretNetworkClient } = useSecretNetworkClientStore()

  useEffect(() => {
    const handleWalletDisconnect = () => {
      // eth_pubkey null on wallet disconnect
      setEthPubkey('')
    }

    // Check if window.ethereum is available
    if (isConnected) {
      // Listen for wallet disconnect events
      ;(window as any).ethereum.on('disconnect', handleWalletDisconnect)
    }

    // Cleanup the event listener when the component unmounts
    return () => {
      if (isConnected) {
        ;(window as any).ethereum.off('disconnect', handleWalletDisconnect)
        // resets proofs
        // resetProofs();
      }
    }
  }, [isConnected])

  // set eth_pubkey
  const handleEthPubkey = (eth_pubkey: string) => {
    setEthPubkey(eth_pubkey)
  }
  // handle eth_sig details
  const [ethSigDetails, setEthSigDetails] = useState(() => {
    try {
      if (isClient) {
        const storedDetails = localStorage.getItem('ethSigDetails')
        return storedDetails ? JSON.parse(storedDetails) : null
      }
      return null
    } catch (error) {
      console.error('Error loading from localStorage:', error)
      return null
    }
  })

  // create eth sig
  const handlePersonalSign = async () => {
    try {
      // ensure metamask is connected
      if (!isConnected || !eth_pubkey) {
        toast.error(
          ' Unable to sign verification message. Please make sure both Metamask & the desired Interchain Terp account is connected.'
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
        // console.log("Personal Sign Signature:", sig);
        if (isClient && typeof localStorage !== 'undefined') {
          localStorage.setItem('ethSigDetails', JSON.stringify(sig))
        }
        setEthSigDetails(sig)
        setIsVerified(true)
      } else {
        toast.error('Error Updating ethSig.')
      }
    } catch (err) {
      console.error(err)
      toast.error('Message Rejected.')
    }
  }

  const resetProofs = () => {
    setProofs([''])
  }

  // // create secret network signing key
  // // contract ref:
  // const createSignKey = async () => {
  //     try {
  //         if (!walletAddress || !isConnected) {
  //             console.error("Wallets not connected not connected");
  //             return;
  //         }
  //         // define the msg to create viewing key
  //         const executeMsg = {
  //             set_viewing_key: {
  //                 key: viewing_key,
  //                 padding: randomPadding,
  //             }

  //         }
  //         // create new msg
  //         const msgExecute = new MsgExecuteContract({
  //             sender: walletAddress,
  //             contract_address: "", // secret testnet
  //             // contract_address: "", // mainnet
  //             code_hash: "",
  //             msg: toUtf8(JSON.stringify(executeMsg)),
  //             sent_funds: [],
  //         });
  //         const sim = await secretNetworkClient.tx.simulate([msgExecute])
  //         const tx = await secretNetworkClient.tx.broadcast([msgExecute], {
  //             gasLimit: Math.ceil(parseInt(sim.gas_info.gas_used) * 1.1),
  //         });

  //     } catch (error) {
  //         toast.error(`create Viewing Key Error: ${error}`);
  //         console.error("ViewingKey Error:", error);
  //     }
  // };

  // claim headstash
  const executeContract = async () => {
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
          eth_sig: ethSigDetails ? ethSigDetails.signatureHash.slice(2) : '', // Removes '0x' prefix
          proof: proofs
        }
      }
      // console.log("Execute Message:", executeMsg);
      // secretjs tech
      const msgExecute = new MsgExecuteContract({
        sender: walletAddress,
        contract_address: '', // secret testnet
        // contract_address: "", // mainnet
        code_hash: '',
        msg: toUtf8(JSON.stringify(executeMsg)),
        sent_funds: []
      })
      const sim = await secretNetworkClient.tx.simulate([msgExecute])
      const tx = await secretNetworkClient.tx.broadcast([msgExecute], {
        gasLimit: Math.ceil(parseInt(sim.gas_info.gas_used) * 1.1)
      })

      //   assertIsDeliverTxSuccess(tx);
      console.log('Execution Result:', tx.transactionHash)
      toast.success(`[View Tx Hash](https://ping.pub/terp/tx/${tx.transactionHash})`)
    } catch (error) {
      toast.error(`Claim Headstash: ${error}`)
      console.error('Execution Error:', error)
    }
  }

  // fetch headstash data
  useEffect(() => {
    console.log('Status:', isConnected)
    console.log('Address:', walletAddress)
    console.log('Metamask:', eth_pubkey)
    console.log('EthSig:', eth_sig)
    console.log('Proofs')

    const fetchHeadstashData = async (eth_pubkey: string) => {
      try {
        if (isConnected && eth_pubkey) {
          const headstashVault = headstashData.find((data) => data.address === eth_pubkey)
          const proofVault = proofData.find((data) => data.address === eth_pubkey)

          if (headstashVault) {
            setAmount(headstashVault.amount)
          } else {
            setAmount('Not Eligible')
          }
          if (proofVault) {
            setProofs(proofVault.proof)
            console.log(proofs)
          } else {
            setProofs(['No proofs were found'])
            console.log(proofs)
          }
        }
      } catch (error) {
        setAmount('fetch if eligible error')
        setProofs(['Error fetching data'])
        console.error('Error fetching data', error)
      }
    }

    void fetchHeadstashData(eth_pubkey)
  }, [isConnected, eth_pubkey, walletAddress])

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
        {amount !== 'Not Eligible' ? formattedTerpAmount : 'Not Eligible'}
        {amount !== 'Not Eligible' ? formattedThiolAmount : ''}

        <Title title={'2. Create Signing Key'} />
        <a
          target="_blank"
          className="text-white block my-6 p-3 w-full text-center font-semibold bg-cyan-600 dark:bg-cyan-600 rounded-lg text-sm hover:bg-cyan-500 dark:hover:bg-cyan-500 focus:bg-cyan-600 dark:focus:bg-cyan-600 transition-colors"
          // onClick={createSignKey}
        >
          Create Signing Keys
        </a>

        <Title title={'3. Verify Ownership'} />
        <button
          className="text-white block my-6 p-3 w-full text-center font-semibold bg-cyan-600 dark:bg-cyan-600 rounded-lg text-sm hover:bg-cyan-500 dark:hover:bg-cyan-500 focus:bg-cyan-600 dark:focus:bg-cyan-600 transition-colors"
          onClick={handlePersonalSign}
          style={{ filter: isConnected ? 'none' : 'blur(5px)' }}
          disabled={!walletAddress || !isConnected || !eth_pubkey || isVerified}
        >
          Sign & Verify
        </button>

        <Title title={'4. Claim Headstash'} />
        <a
          target="_blank"
          className="text-white block my-6 p-3 w-full text-center font-semibold bg-cyan-600 dark:bg-cyan-600 rounded-lg text-sm hover:bg-cyan-500 dark:hover:bg-cyan-500 focus:bg-cyan-600 dark:focus:bg-cyan-600 transition-colors"
          onClick={executeContract}
        >
          Claim Your Headstash, Privately
        </a>

        <Title title={'5. Choose Next Steps'} />
        <ProofComponent isConnected={false} eth_pubkey={eth_pubkey} walletAddress={walletAddress} />

        {/* <a
          href="https://tunnel.scrt.network"
          target="_blank"
          className="text-white block my-6 p-3 w-full text-center font-semibold bg-cyan-600 dark:bg-cyan-600 rounded-lg text-sm hover:bg-cyan-500 dark:hover:bg-cyan-500 focus:bg-cyan-600 dark:focus:bg-cyan-600 transition-colors"
          onClick={() => {
            trackMixPanelEvent('Clicked Secret Tunnel link (from Bridge page)')
          }}
        >
          Go to Secret Tunnel
          <FontAwesomeIcon icon={faArrowUpRightFromSquare} className="ml-2" />
        </a> */}

        {/* <p>
          Use the{" "}
          <a
            href="https://ipfs.trivium.network/ipns/k51qzi5uqu5dhovcugri8aul3itkct8lvnodtnv2y3o1saotkjsa7ao1aq0dqa/"
            target="_blank"
            className="pb-0.5 border-b border-neutral-400 dark:border-neutral-600 hover:text-black dark:hover:text-white hover:border-black dark:hover:border-white transition-colors"
          >
            Monero Bridge
          </a>{" "}
          to bridge your XMR from Monero to Secret Network.
          <a
            href="https://ipfs.trivium.network/ipns/k51qzi5uqu5dhovcugri8aul3itkct8lvnodtnv2y3o1saotkjsa7ao1aq0dqa/"
            target="_blank"
            className="text-white block my-6 p-3 w-full text-center font-semibold bg-cyan-600 dark:bg-cyan-600 rounded-lg text-sm hover:bg-cyan-500 dark:hover:bg-cyan-500 focus:bg-cyan-600 dark:focus:bg-cyan-600 transition-colors"
            onClick={() => {
              trackMixPanelEvent(
                "Clicked Monero Bridge link (from Bridge page)"
              );
            }}
          >
            Go to Monero Bridge
            <FontAwesomeIcon icon={faArrowUpRightFromSquare} className="ml-2" />
          </a>
        </p> */}
      </div>
    </>
  )
}

export default Headstash
