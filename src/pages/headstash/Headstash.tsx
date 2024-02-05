import { faArrowUpRightFromSquare, faShuffle } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { Link } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import { bridgeJsonLdSchema, bridgePageDescription, bridgePageTitle, formatNumber, headstashPageTitle, pageTitle } from 'utils/commons'
import mixpanel from 'mixpanel-browser'
import { useEffect, useState, useContext } from 'react'
import { trackMixPanelEvent } from 'utils/commons'
import SquidModal from './SquidModal'
import { ThemeContext } from 'context/ThemeContext'
import HoudiniModal from './HoudiniModal'
import { useSecretNetworkClientStore } from 'store/secretNetworkClient'
import { useIsClient } from "hooks/useIsClient";
import Title from 'components/Title'
import MetamaskConnectButton from 'components/Wallet/metamask-connect-button'
import { proofData, headstashData } from 'lib/headstash'
import toast from 'react-hot-toast'
import Wallet from 'components/Wallet/Wallet'


function Headstash() {
    useEffect(() => {
        trackMixPanelEvent('Open Bridge Tab')
    }, [])


    const { theme } = useContext(ThemeContext)
    const [isSquidModalOpen, setIsSquidModalOpen] = useState(false)
    const [isHoudiniModalOpen, setIsHoudiniModalOpen] = useState(false)
    const [eth_pubkey, setEthPubkey] = useState('');
    const [eth_sig] = useState('');
    const [amount, setAmount] = useState('');
    const formattedTerpAmount = `${amount.slice(0, 5)}.${amount.slice(5)} $TERP`;
    const formattedThiolAmount = `${amount.slice(0, 5)}.${amount.slice(5)} $THIOL`;
    const [proofs, setProofs] = useState<string[]>(['']);
    const isClient = useIsClient();
    const [isVerified, setIsVerified] = useState(false);


    const { walletAddress, isConnected } = useSecretNetworkClientStore()

    useEffect(() => {
        const handleWalletDisconnect = () => {
            // eth_pubkey null on wallet disconnect
            setEthPubkey('');
        };

        // Check if window.ethereum is available
        if (isConnected) {
            // Listen for wallet disconnect events
            (window as any).ethereum.on('disconnect', handleWalletDisconnect);
        }

        // Cleanup the event listener when the component unmounts
        return () => {
            if (isConnected) {
                (window as any).ethereum.off('disconnect', handleWalletDisconnect);
                // resets proofs
                resetProofs();
            }
        };
    }, [isConnected]);

    const [ethSigDetails, setEthSigDetails] = useState(() => {
        try {
            if (isClient) {
                const storedDetails = localStorage.getItem("ethSigDetails");
                return storedDetails ? JSON.parse(storedDetails) : null;
            }
            return null;
        } catch (error) {
            console.error("Error loading from localStorage:", error);
            return null;
        }
    });

    // set eth_pubkey
    const handleEthPubkey = (eth_pubkey: string) => {
        setEthPubkey(eth_pubkey);
    };

    // create eth sig
    const handlePersonalSign = async () => {
        try {
            // ensure metamask is connected
            if (!isConnected || !eth_pubkey) {
                toast.error(" Unable to sign verification message. Please make sure both Metamask & the desired Interchain Terp account is connected.");
                return;
            }
            if (walletAddress !== undefined) {
                const terpAddress: string = walletAddress.toString();
                const from = eth_pubkey;
                const cosmosWallet = terpAddress;
                const msg = `0x${Buffer.from(cosmosWallet, 'utf8').toString('hex')}`;
                const sign = await (window as any).ethereum.request({
                    method: 'personal_sign',
                    params: [msg, from],
                });
                const sig = {
                    message: cosmosWallet,
                    signatureHash: sign,
                    address: from,
                    timestamp: new Date().toISOString(),
                };

                console.log("Personal Sign Signature:", sig);

                if (isClient && typeof localStorage !== "undefined") {
                    localStorage.setItem("ethSigDetails", JSON.stringify(sig));
                }
                setEthSigDetails(sig);
                setIsVerified(true);
            } else {
                toast.error("Error Updating ethSig.")
            }
        } catch (err) {
            console.error(err);
            toast.error("Message Rejected.")
        }
    };

    // fetch proofs from `@/lib/headstash/proofData.ts`
    useEffect(() => {
        const fetchProofs = async (eth_pubkey: string) => {
            try {
                if (isConnected && eth_pubkey) {
                    const matchedData = proofData.find((data) => data.address === eth_pubkey);
                    if (matchedData) {
                        setProofs(matchedData.proof);
                        console.log(proofs)
                    } else {
                        setProofs(['No proofs were found']);
                        console.log(proofs)
                    }
                }
            } catch (error) {
                console.error('Error fetching Proof data', error);
                setProofs(['Error fetching data']);
            }
        };
        void fetchProofs(eth_pubkey);
    }, [isConnected, eth_pubkey, walletAddress]);

    const resetProofs = () => {
        setProofs(['']);
    };


    // fetch headstash data
    useEffect(() => {
        console.log('Status:', status);
        console.log('Address:', walletAddress);
        console.log('Metamask:', eth_pubkey);
        console.log('EthSig:', eth_sig);
        const fetchHeadstashData = async (eth_pubkey: string) => {
            try {
                if (isConnected && eth_pubkey) {
                    const matchedData = headstashData.find((data) => data.address === eth_pubkey);
                    if (matchedData) {
                        setAmount(matchedData.amount);
                    } else {
                        setAmount('Not Eligible')
                    }
                }
            } catch (error) {
                setAmount('fetch if eligible error');
            }
        };

        void fetchHeadstashData(eth_pubkey);
    }, [isConnected, eth_pubkey, walletAddress]);


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
                    onClick={() => { }}
                >
                    Create Signing Keys
                </a>

                <Title title={'3. Verify Ownership'} />
                <button
                    className="text-white block my-6 p-3 w-full text-center font-semibold bg-cyan-600 dark:bg-cyan-600 rounded-lg text-sm hover:bg-cyan-500 dark:hover:bg-cyan-500 focus:bg-cyan-600 dark:focus:bg-cyan-600 transition-colors"
                    onClick={handlePersonalSign}
                  style={{ filter: isConnected ? 'none' : 'blur(5px)' }}
                  disabled={!walletAddress || status !== 'Connected' || !eth_pubkey || isVerified}
                >
                    Sign & Verify
                </button>

                <Title title={'4. Claim Headstash'} />
                <a
                    target="_blank"
                    className="text-white block my-6 p-3 w-full text-center font-semibold bg-cyan-600 dark:bg-cyan-600 rounded-lg text-sm hover:bg-cyan-500 dark:hover:bg-cyan-500 focus:bg-cyan-600 dark:focus:bg-cyan-600 transition-colors"
                    onClick={() => { }}
                >
                    Claim Your Headstash, Privately
                </a>

                <Title title={'5. Choose Next Steps'} />


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
                    Alternatively, use Squid Router to bridge your assets into Secret Network.
                    <a
                        target="_blank"
                        className="text-white block my-6 p-3 w-full text-center font-semibold bg-cyan-600 dark:bg-cyan-600 rounded-lg text-sm hover:bg-cyan-500 dark:hover:bg-cyan-500 focus:bg-cyan-600 dark:focus:bg-cyan-600 transition-colors"
                        onClick={() => {
                            trackMixPanelEvent('Clicked Squid Router Modal (from Bridge page)')
                            setIsSquidModalOpen(true)
                        }}
                    >
                        Use Squid Router
                    </a>
                </p>
                <SquidModal
                    open={isSquidModalOpen}
                    onClose={() => {
                        setIsSquidModalOpen(false)
                        document.body.classList.remove('overflow-hidden')
                    }}
                    theme={theme}
                />
                <p>
                    Or anonymously bridge your assets into SCRT using Houdini Swap.
                    <a
                        target="_blank"
                        className="text-white block my-6 p-3 w-full text-center font-semibold bg-cyan-600 dark:bg-cyan-600 rounded-lg text-sm hover:bg-cyan-500 dark:hover:bg-cyan-500 focus:bg-cyan-600 dark:focus:bg-cyan-600 transition-colors"
                        onClick={() => {
                            trackMixPanelEvent('Clicked Houdini Swap Modal (from Bridge page)')
                            setIsHoudiniModalOpen(true)
                        }}
                    >
                        Use Houdini Swap
                    </a>
                </p>
                <HoudiniModal
                    open={isHoudiniModalOpen}
                    onClose={() => {
                        setIsHoudiniModalOpen(false)
                        document.body.classList.remove('overflow-hidden')
                    }}
                    theme={theme}
                    secretAddress={walletAddress}
                />
                <p>
                    <span className="select-none">
                        <span className="inline-block bg-emerald-500 dark:bg-emerald-800 text-white text-xs py-0.5 px-1.5 rounded uppercase font-semibold">
                            Protip
                        </span>{' '}
                        –{' '}
                    </span>
                    If you want to bridge Axelar Assets (such as USDC, USDT) from other Cosmos based chains (Osmosis, Kujira) to
                    Secret, please use the IBC tab:
                    <Link
                        to={'/ibc'}
                        className="text-white block my-6 p-3 w-full text-center font-semibold bg-cyan-600 dark:bg-cyan-600 rounded-lg text-sm hover:bg-cyan-500 dark:hover:bg-cyan-500 focus:bg-cyan-600 dark:focus:bg-cyan-600 transition-colors"
                        onClick={() => {
                            trackMixPanelEvent('Clicked IBC transfer link (from Bridge page)')
                        }}
                    >
                        <FontAwesomeIcon icon={faShuffle} className="mr-2" />
                        Go to IBC Transfers
                    </Link>
                </p> */}
                {/*  <p>
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
