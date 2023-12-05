// /* eslint-disable @typescript-eslint/no-unsafe-assignment */
// // import { AirdropUpload } from 'components/AirdropUpload'
// import { toUtf8 } from '@cosmjs/encoding'

// import {DispatchExecuteArgs, dispatchExecute, previewExecutePayload } from './actions'
// import type { Badge, BadgeHubInstance } from 'contracts/badgeHub'
// import sizeof from 'object-sizeof'
// import type { FormEvent } from 'react'
// import { useEffect, useState } from 'react'
// import { toast } from 'react-hot-toast'
// import { useMutation } from 'react-query'
// import * as secp256k1 from 'secp256k1'
// import { useWallet } from 'utils/wallet'
// import { Alert } from '../../ui/alert'
// import { Conditional } from '../utils/conditional'
// import { FormControl } from '../forms/formControl'
// import { ActionsCombobox } from './Combobox'
// import { FormGroup } from '../forms/FormGroup'
// import { useInputState, useNumberInputState } from '../forms/formInput.hooks'
// import { MetadataAttributes } from '../forms/MetadataAttributes'
// import { MintRule } from '../creation/imageUploadDetails'
// import { AddressInput, NumberInput, TextInput } from '../forms/formInput'
// import { JsonPreview } from '../components/jsonPreview'
// import { generateKeyPairs, sha256 } from '../utils/hash'
// import { isValidAddress } from '../utils/isValidAddress'
// import { useMetadataAttributesState } from '../forms/MetadataAttributes.hooks'
// import { Button } from '@interchain-ui/react'
// import { AddressList } from '../forms/AddressList'
// import { TransactionHash } from '../components/TransactionHash'
// import { BadgeAirdropListUpload } from './airdropListUpload'
// import { useAddressListState } from '../forms/AddressList.hooks'
// import { isEitherType } from './actions'
// import { resolveAddress } from '../utils/resolveAddress'
// import { useActionsComboboxState } from './Combobox.hooks'
// import { WhitelistUpload } from './whitelistUpload'

// interface BadgeActionsProps {
//   badgeHubContractAddress: string
//   badgeId: number
//   badgeHubMessages: BadgeHubInstance | undefined
//   mintRule: MintRule
// }

// type TransferrableType = true | false | undefined

// export const BadgeActions = ({ badgeHubContractAddress, badgeId, badgeHubMessages, mintRule }: BadgeActionsProps) => {
//   const wallet = useWallet()
//   const [lastTx, setLastTx] = useState('')

//   const [timestamp] = useState<Date | undefined>(undefined)
//   const [airdropAllocationArray, setAirdropAllocationArray] = useState<string[]>([])
//   const [badge, setBadge] = useState<Badge>()
//   const [transferrable] = useState<TransferrableType>(undefined)
//   const [resolvedOwnerAddress, setResolvedOwnerAddress] = useState<string>('')
//   const [editFee, setEditFee] = useState<number | undefined>(undefined)
//   const [triggerDispatch, setTriggerDispatch] = useState<boolean>(false)
//   const [keyPairs, setKeyPairs] = useState<{ publicKey: string; privateKey: string }[]>([])
//   const [signature, setSignature] = useState<string>('')
//   const [ownerList, setOwnerList] = useState<string[]>([])
//   const [numberOfKeys, setNumberOfKeys] = useState(0)

//   const actionComboboxState = useActionsComboboxState()
//   const type = actionComboboxState.value?.id

//   const maxSupplyState = useNumberInputState({
//     id: 'max-supply',
//     name: 'max-supply',
//     title: 'Max Supply',
//     subtitle: 'Maximum number of badges that can be minted',
//   })

//   // Metadata related fields
//   const managerState = useInputState({
//     id: 'manager-address',
//     name: 'manager',
//     title: 'Manager',
//     subtitle: 'Badge Hub Manager',
//     defaultValue: wallet.address,
//   })

//   const nameState = useInputState({
//     id: 'metadata-name',
//     name: 'metadata-name',
//     title: 'Name',
//     subtitle: 'Name of the badge',
//   })

//   const descriptionState = useInputState({
//     id: 'metadata-description',
//     name: 'metadata-description',
//     title: 'Description',
//     subtitle: 'Description of the badge',
//   })

//   const imageState = useInputState({
//     id: 'metadata-image',
//     name: 'metadata-image',
//     title: 'Image',
//     subtitle: 'Badge Image URL',
//   })

//   const imageDataState = useInputState({
//     id: 'metadata-image-data',
//     name: 'metadata-image-data',
//     title: 'Image Data',
//     subtitle: 'Raw SVG image data',
//   })

//   const externalUrlState = useInputState({
//     id: 'metadata-external-url',
//     name: 'metadata-external-url',
//     title: 'External URL',
//     subtitle: 'External URL for the badge',
//   })

//   const attributesState = useMetadataAttributesState()

//   const backgroundColorState = useInputState({
//     id: 'metadata-background-color',
//     name: 'metadata-background-color',
//     title: 'Background Color',
//     subtitle: 'Background color of the badge',
//   })

//   const animationUrlState = useInputState({
//     id: 'metadata-animation-url',
//     name: 'metadata-animation-url',
//     title: 'Animation URL',
//     subtitle: 'Animation URL for the badge',
//   })

//   const youtubeUrlState = useInputState({
//     id: 'metadata-youtube-url',
//     name: 'metadata-youtube-url',
//     title: 'YouTube URL',
//     subtitle: 'YouTube URL for the badge',
//   })
//   // Rules related fields
//   const keyState = useInputState({
//     id: 'key',
//     name: 'key',
//     title: 'Key',
//     subtitle: 'The key generated for the badge',
//   })

//   const ownerState = useInputState({
//     id: 'owner-address',
//     name: 'owner',
//     title: 'Owner',
//     subtitle: 'The owner of the badge',
//     defaultValue: wallet.address,
//   })

//   const ownerListState = useAddressListState()

//   const pubKeyState = useInputState({
//     id: 'pubKey',
//     name: 'pubKey',
//     title: 'Public Key',
//     subtitle:
//       type === 'mint_by_keys'
//         ? 'The whitelisted public key authorized to mint a badge'
//         : 'The public key to check whether it can be used to mint a badge',
//   })

//   const privateKeyState = useInputState({
//     id: 'privateKey',
//     name: 'privateKey',
//     title: 'Private Key',
//     subtitle:
//       type === 'mint_by_keys'
//         ? 'The corresponding private key for the whitelisted public key'
//         : 'The private key that was generated during badge creation',
//   })

//   const nftState = useInputState({
//     id: 'nft-address',
//     name: 'nft-address',
//     title: 'NFT Contract Address',
//     subtitle: 'The NFT Contract Address for the badge',
//   })

//   const limitState = useNumberInputState({
//     id: 'limit',
//     name: 'limit',
//     title: 'Limit',
//     subtitle: 'Number of keys/owners to execute the action for (0 for all)',
//   })

//   const showMetadataField = isEitherType(type, ['edit_badge'])
//   const showOwnerField = isEitherType(type, ['mint_by_key', 'mint_by_keys', 'mint_by_minter'])
//   const showPrivateKeyField = isEitherType(type, ['mint_by_key', 'mint_by_keys', 'airdrop_by_key'])
//   const showAirdropFileField = isEitherType(type, ['airdrop_by_key'])
//   const showOwnerList = isEitherType(type, ['mint_by_minter'])
//   const showPubKeyField = isEitherType(type, ['mint_by_keys'])
//   const showLimitState = isEitherType(type, ['purge_keys', 'purge_owners'])

//   const payload: DispatchExecuteArgs = {
//     badge: {
//       manager: badge?.manager || managerState.value,
//       metadata: {
//         name: nameState.value || undefined,
//         description: descriptionState.value || undefined,
//         image: imageState.value || undefined,
//         image_data: imageDataState.value || undefined,
//         external_url: externalUrlState.value || undefined,
//         attributes:
//           attributesState.values[0]?.trait_type && attributesState.values[0]?.value
//             ? attributesState.values
//                 .map((attr) => ({
//                   trait_type: attr.trait_type,
//                   value: attr.value,
//                 }))
//                 .filter((attr) => attr.trait_type && attr.value)
//             : undefined,
//         background_color: backgroundColorState.value || undefined,
//         animation_url: animationUrlState.value || undefined,
//         youtube_url: youtubeUrlState.value || undefined,
//       },
//       transferrable: transferrable === true,
//       rule: {
//         by_key: keyState.value,
//       },
//       expiry: timestamp ? timestamp.getTime() * 1000000 : undefined,
//       max_supply: maxSupplyState.value || undefined,
//     },
//     metadata: {
//       name: nameState.value || undefined,
//       description: descriptionState.value || undefined,
//       image: imageState.value || undefined,
//       image_data: imageDataState.value || undefined,
//       external_url: externalUrlState.value || undefined,
//       attributes:
//         attributesState.values[0]?.trait_type && attributesState.values[0]?.value
//           ? attributesState.values
//               .map((attr) => ({
//                 trait_type: attr.trait_type,
//                 value: attr.value,
//               }))
//               .filter((attr) => attr.trait_type && attr.value)
//           : undefined,
//       background_color: backgroundColorState.value || undefined,
//       animation_url: animationUrlState.value || undefined,
//       youtube_url: youtubeUrlState.value || undefined,
//     },
//     id: badgeId,
//     editFee,
//     owner: resolvedOwnerAddress,
//     pubkey: pubKeyState.value,
//     signature,
//     keys: keyPairs.map((keyPair) => keyPair.publicKey),
//     limit: limitState.value || undefined,
//     owners: [
//       ...new Set(
//         ownerListState.values
//           .map((a) => a.address.trim())
//           .filter((address) => address !== '' && isValidAddress(address.trim()) && address.startsWith('terp'))
//           .concat(ownerList),
//       ),
//     ],
//     recipients: airdropAllocationArray,
//     privateKey: privateKeyState.value,
//     nft: nftState.value,
//     badgeHubMessages,
//     badgeHubContract: badgeHubContractAddress,
//     txSigner: wallet.address || '',
//     type,
//   }

//   const resolveOwnerAddress = async () => {
//     await resolveAddress(ownerState.value.trim(), wallet).then((resolvedAddress) => {
//       setResolvedOwnerAddress(resolvedAddress)
//     })
//   }
//   useEffect(() => {
//     void resolveOwnerAddress()
//   }, [ownerState.value])

//   const resolveManagerAddress = async () => {
//     await resolveAddress(managerState.value.trim(), wallet).then((resolvedAddress) => {
//       setBadge({
//         manager: resolvedAddress,
//         metadata: {
//           name: nameState.value || undefined,
//           description: descriptionState.value || undefined,
//           image: imageState.value || undefined,
//           image_data: imageDataState.value || undefined,
//           external_url: externalUrlState.value || undefined,
//           attributes:
//             attributesState.values[0]?.trait_type && attributesState.values[0]?.value
//               ? attributesState.values
//                   .map((attr) => ({
//                     trait_type: attr.trait_type,
//                     value: attr.value,
//                   }))
//                   .filter((attr) => attr.trait_type && attr.value)
//               : undefined,
//           background_color: backgroundColorState.value || undefined,
//           animation_url: animationUrlState.value || undefined,
//           youtube_url: youtubeUrlState.value || undefined,
//         },
//         transferrable: transferrable === true,
//         rule: {
//           by_key: keyState.value,
//         },
//         expiry: timestamp ? timestamp.getTime() * 1000000 : undefined,
//         max_supply: maxSupplyState.value || undefined,
//       })
//     })
//   }

//   useEffect(() => {
//     void resolveManagerAddress()
//   }, [managerState.value])

//   useEffect(() => {
//     setBadge({
//       manager: managerState.value,
//       metadata: {
//         name: nameState.value || undefined,
//         description: descriptionState.value || undefined,
//         image: imageState.value || undefined,
//         image_data: imageDataState.value || undefined,
//         external_url: externalUrlState.value || undefined,
//         attributes:
//           attributesState.values[0]?.trait_type && attributesState.values[0]?.value
//             ? attributesState.values
//                 .map((attr) => ({
//                   trait_type: attr.trait_type,
//                   value: attr.value,
//                 }))
//                 .filter((attr) => attr.trait_type && attr.value)
//             : undefined,
//         background_color: backgroundColorState.value || undefined,
//         animation_url: animationUrlState.value || undefined,
//         youtube_url: youtubeUrlState.value || undefined,
//       },
//       transferrable: transferrable === true,
//       rule: {
//         by_key: keyState.value,
//       },
//       expiry: timestamp ? timestamp.getTime() * 1000000 : undefined,
//       max_supply: maxSupplyState.value || undefined,
//     })
//   }, [
//     nameState.value,
//     descriptionState.value,
//     imageState.value,
//     imageDataState.value,
//     externalUrlState.value,
//     attributesState.values,
//     backgroundColorState.value,
//     animationUrlState.value,
//     youtubeUrlState.value,
//     transferrable,
//     keyState.value,
//     timestamp,
//     maxSupplyState.value,
//   ])

//   useEffect(() => {
//     if (attributesState.values.length === 0)
//       attributesState.add({
//         trait_type: '',
//         value: '',
//       })
//   }, [])

//   useEffect(() => {
//     void dispatchEditBadgeMessage().catch((err) => {
//       toast.error(String(err), { style: { maxWidth: 'none' } })
//     })
//   }, [triggerDispatch])

//   useEffect(() => {
//     if (privateKeyState.value.length === 64 && resolvedOwnerAddress)
//       handleGenerateSignature(badgeId, resolvedOwnerAddress, privateKeyState.value)
//   }, [privateKeyState.value, resolvedOwnerAddress])

//   useEffect(() => {
//     if (numberOfKeys > 0) {
//       setKeyPairs(generateKeyPairs(numberOfKeys))
//     }
//   }, [numberOfKeys])

//   const handleDownloadKeys = () => {
//     const element = document.createElement('a')
//     const file = new Blob([JSON.stringify(keyPairs)], { type: 'text/plain' })
//     element.href = URL.createObjectURL(file)
//     element.download = `badge-${badgeId.toString()}-keys.json`
//     document.body.appendChild(element)
//     element.click()
//   }

//   const { isLoading, mutate } = useMutation(
//     async (event: FormEvent) => {
//       if (!wallet.isWalletConnected) {
//         throw new Error('Please connect your wallet.')
//       }
//       event.preventDefault()
//       if (!type) {
//         throw new Error('Please select an action.')
//       }
//       if (badgeHubContractAddress === '') {
//         throw new Error('Please enter the Badge Hub contract addresses.')
//       }

//       if (type === 'mint_by_key' && privateKeyState.value.length !== 64) {
//         throw new Error('Please enter a valid private key.')
//       }

//       if (type === 'edit_badge') {
//         const feeRateRaw = await (
//           await wallet.getCosmWasmClient()
//         ).queryContractRaw(
//           badgeHubContractAddress,
//           toUtf8(Buffer.from(Buffer.from('fee_rate').toString('hex'), 'hex').toString()),
//         )
//         const feeRate = JSON.parse(new TextDecoder().decode(feeRateRaw as Uint8Array))

//         await toast
//           .promise(
//             (
//               await wallet.getCosmWasmClient()
//             ).queryContractSmart(badgeHubContractAddress, {
//               badge: { id: badgeId },
//             }),
//             {
//               error: `Edit Fee calculation failed!`,
//               loading: 'Calculating Edit Fee...',
//               success: (currentBadge) => {
//                 console.log('Current badge: ', currentBadge)
//                 return `Current metadata is ${
//                   Number(sizeof(currentBadge.metadata)) + Number(sizeof(currentBadge.metadata.attributes))
//                 } bytes in size.`
//               },
//             },
//           )
//           .then((currentBadge) => {
//             // TODO - Go over the calculation
//             const currentBadgeMetadataSize =
//               Number(sizeof(currentBadge.metadata)) + Number(sizeof(currentBadge.metadata.attributes) * 2)
//             console.log('Current badge metadata size: ', currentBadgeMetadataSize)
//             const newBadgeMetadataSize =
//               Number(sizeof(badge?.metadata)) + Number(sizeof(badge?.metadata.attributes)) * 2
//             console.log('New badge metadata size: ', newBadgeMetadataSize)
//             if (newBadgeMetadataSize > currentBadgeMetadataSize) {
//               const calculatedFee = ((newBadgeMetadataSize - currentBadgeMetadataSize) * Number(feeRate.metadata)) / 2
//               setEditFee(calculatedFee)
//               setTriggerDispatch(!triggerDispatch)
//             } else {
//               setEditFee(undefined)
//               setTriggerDispatch(!triggerDispatch)
//             }
//           })
//           .catch((error) => {
//             throw new Error(String(error).substring(String(error).lastIndexOf('Error:') + 7))
//           })
//       } else {
//         const txHash = await toast.promise(dispatchExecute(payload), {
//           error: `${type.charAt(0).toUpperCase() + type.slice(1)} execute failed!`,
//           loading: 'Executing message...',
//           success: (tx) => `Transaction ${tx} success!`,
//         })
//         if (txHash) {
//           setLastTx(txHash)
//         }
//       }
//     },
//     {
//       onError: (error) => {
//         toast.error(String(error), { style: { maxWidth: 'none' } })
//       },
//     },
//   )

//   const dispatchEditBadgeMessage = async () => {
//     if (type) {
//       const txHash = await toast.promise(dispatchExecute(payload), {
//         error: `${type.charAt(0).toUpperCase() + type.slice(1)} execute failed!`,
//         loading: 'Executing message...',
//         success: (tx) => `Transaction ${tx} success!`,
//       })
//       if (txHash) {
//         setLastTx(txHash)
//       }
//     }
//   }

//   const airdropFileOnChange = (data: string[]) => {
//     console.log(data)
//     setAirdropAllocationArray(data)
//   }

//   const handleGenerateSignature = (id: number, owner: string, privateKey: string) => {
//     try {
//       const message = `claim badge ${id} for user ${owner}`

//       const privKey = Buffer.from(privateKey, 'hex')
//       // const pubKey = Buffer.from(secp256k1.publicKeyCreate(privKey, true))
//       const msgBytes = Buffer.from(message, 'utf8')
//       const msgHashBytes = sha256(msgBytes)
//       const signedMessage = secp256k1.ecdsaSign(msgHashBytes, privKey)
//       setSignature(Buffer.from(signedMessage.signature).toString('hex'))
//     } catch (error) {
//       console.log(error)
//       toast.error('Error generating signature.')
//     }
//   }

//   return (
//     <form>
//       <div className="grid grid-cols-2 mt-4">
//         <div className="mr-2">
//           <ActionsCombobox mintRule={mintRule} {...actionComboboxState} />
//           {showMetadataField && (
//             <div className="p-4 mt-2 rounded-md border-2 border-gray-800">
//               <span className="text-gray-400">Metadata</span>
//               <TextInput className="mt-2" {...nameState} />
//               <TextInput className="mt-2" {...descriptionState} />
//               <TextInput className="mt-2" {...imageState} />
//               <TextInput className="mt-2" {...imageDataState} />
//               <TextInput className="mt-2" {...externalUrlState} />
//               <div className="mt-2">
//                 <MetadataAttributes
//                   attributes={attributesState.entries}
//                   onAdd={attributesState.add}
//                   onChange={attributesState.update}
//                   onRemove={attributesState.remove}
//                   title="Traits"
//                 />
//               </div>
//               <TextInput className="mt-2" {...backgroundColorState} />
//               <TextInput className="mt-2" {...animationUrlState} />
//               <TextInput className="mt-2" {...youtubeUrlState} />
//             </div>
//           )}
//           {showOwnerField && (
//             <AddressInput
//               className="mt-2"
//               {...ownerState}
//               subtitle="The address that the badge will be minted to"
//               title="Owner"
//             />
//           )}
//           {showPubKeyField && <TextInput className="mt-2" {...pubKeyState} />}
//           {showPrivateKeyField && <TextInput className="mt-2" {...privateKeyState} />}
//           {showLimitState && <NumberInput className="mt-2" {...limitState} />}
//           <Conditional test={isEitherType(type, ['purge_owners', 'purge_keys'])}>
//             <Alert className="mt-4" variant="default">
//               This action is only available if the badge with the specified id is either minted out or expired.
//             </Alert>
//           </Conditional>

//           <Conditional test={type === 'add_keys'}>
//             <div className="flex flex-row justify-start py-3 mt-4 mb-3 w-full rounded border-2 border-white/20">
//               <div className="grid grid-cols-2 gap-24">
//                 <div className="flex flex-col ml-4">
//                   <span className="font-bold">Number of Keys</span>
//                   <span className="text-sm text-white/80">
//                     The number of public keys to be whitelisted for minting badges
//                   </span>
//                 </div>
//                 <input
//                   className="p-2 mt-4 w-1/2 max-w-2xl h-1/2 bg-white/10 rounded border-2 border-white/20"
//                   onChange={(e) => setNumberOfKeys(Number(e.target.value))}
//                   required
//                   type="number"
//                   value={numberOfKeys}
//                 />
//               </div>
//             </div>
//           </Conditional>

//           <Conditional test={numberOfKeys > 0 && type === 'add_keys'}>
//             <Alert variant="default">
//               <div className="pt-2">
//                 <span className="mt-2">
//                   Make sure to download the whitelisted public keys together with their private key counterparts.
//                 </span>
//                 <Button className="mt-2" onClick={() => handleDownloadKeys()}>
//                   Download Key Pairs
//                 </Button>
//               </div>
//             </Alert>
//           </Conditional>

//           <Conditional test={showOwnerList}>
//             <div className="mt-4">
//               <AddressList
//                 entries={ownerListState.entries}
//                 isRequired
//                 onAdd={ownerListState.add}
//                 onChange={ownerListState.update}
//                 onRemove={ownerListState.remove}
//                 subtitle="Enter the owner addresses"
//                 title="Addresses"
//               />
//               <Alert className="mt-8" variant="default">
//                 You may optionally choose a text file of additional owner addresses.
//               </Alert>
//               <WhitelistUpload onChange={setOwnerList} />
//             </div>
//           </Conditional>

//           {showAirdropFileField && (
//             <FormGroup
//               subtitle="TXT file that contains the addresses to airdrop a badge for"
//               title="Badge Airdrop List File"
//             >
//               <BadgeAirdropListUpload onChange={airdropFileOnChange} />
//             </FormGroup>
//           )}
//         </div>
//         <div className="-mt-6">
//           <div className="relative mb-2">
//             <Button
//               className="absolute top-0 right-0"
//               isLoading={isLoading}
//               onClick={mutate}
//               // rightIcon={<FaArrowRight />}
//             >
//               Execute
//             </Button>
//             <FormControl subtitle="View execution transaction hash" title="Transaction Hash">
//               <TransactionHash hash={lastTx} />
//             </FormControl>
//           </div>
//           <FormControl subtitle="View current message to be sent" title="Payload Preview">
//             <JsonPreview content={previewExecutePayload(payload)} isCopyable />
//           </FormControl>
//         </div>
//       </div>
//     </form>
//   )
// }
