// import { Combobox, Transition } from '@headlessui/react'
// import clsx from 'clsx'

// import { matchSorter } from 'match-sorter'
// import { Fragment, useEffect, useState } from 'react'
// import { FaChevronDown, FaInfoCircle } from 'react-icons/fa'



// import { BY_KEY_QUERY_LIST, BY_KEYS_QUERY_LIST, BY_MINTER_QUERY_LIST } from './query'
// import { FormControl } from '../forms/formControl'
// import { QueryListItem } from '@/contracts/badgeHub/messages/query'
// import { MintRule } from '../creation/imageUploadDetails'

// export interface QueryComboboxProps {
//   value: QueryListItem | null
//   onChange: (item: QueryListItem) => void
//   mintRule?: MintRule
// }

// export const QueryCombobox = ({ value, onChange, mintRule }: QueryComboboxProps) => {
//   const [search, setSearch] = useState('')
//   const [QUERY_LIST, SET_QUERY_LIST] = useState<QueryListItem[]>(BY_KEY_QUERY_LIST)

//   useEffect(() => {
//     if (mintRule === 'by_keys') {
//       SET_QUERY_LIST(BY_KEYS_QUERY_LIST)
//     } else if (mintRule === 'by_minter') {
//       SET_QUERY_LIST(BY_MINTER_QUERY_LIST)
//     } else {
//       SET_QUERY_LIST(BY_KEY_QUERY_LIST)
//     }
//   }, [mintRule])

//   const filtered = search === '' ? QUERY_LIST : matchSorter(QUERY_LIST, search, { keys: ['id', 'name', 'description'] })

//   return (
//     <Combobox
//       as={FormControl}
//       htmlId="query"
//       labelAs={Combobox.Label}
//       onChange={onChange}
//       subtitle="Badge queries"
//       title=""
//       value={value}
//     >
//       <div className="relative">
//         <Combobox.Input
//           className={clsx(
//             'w-full bg-white/10 rounded border-2 border-white/20 form-input',
//             'placeholder:text-white/50',
//             'focus:ring focus:ring-plumbus-20',
//           )}
//           displayValue={(val?: QueryListItem) => val?.name ?? ''}
//           id="message-type"
//           onChange={(event) => setSearch(event.target.value)}
//           placeholder="Select query"
//         />

//         <Combobox.Button
//           className={clsx(
//             'flex absolute inset-y-0 right-0 items-center p-4',
//             'opacity-50 hover:opacity-100 active:opacity-100',
//           )}
//         >
//           {({ open }) => <FaChevronDown aria-hidden="true" className={clsx('w-4 h-4', { 'rotate-180': open })} />}
//         </Combobox.Button>

//         <Transition afterLeave={() => setSearch('')} as={Fragment}>
//           <Combobox.Options
//             className={clsx(
//               'overflow-auto absolute z-10 mt-2 w-full max-h-[30vh]',
//               'bg-stone-800/80 rounded shadow-lg backdrop-blur-sm',
//               'divide-y divide-stone-500/50',
//             )}
//           >
//             {filtered.length < 1 && (
//               <span className="flex flex-col justify-center items-center p-4 text-sm text-center text-white/50">
//                 Query not found
//               </span>
//             )}
//             {filtered.map((entry) => (
//               <Combobox.Option
//                 key={entry.id}
//                 className={({ active }) =>
//                   clsx('flex relative flex-col py-2 px-4 space-y-1 cursor-pointer', { 'bg-stargaze-80': active })
//                 }
//                 value={entry}
//               >
//                 <span className="font-bold">{entry.name}</span>
//                 <span className="max-w-md text-sm">{entry.description}</span>
//               </Combobox.Option>
//             ))}
//           </Combobox.Options>
//         </Transition>
//       </div>

//       {value && (
//         <div className="flex space-x-2 text-white/50">
//           <div className="mt-1">
//             <FaInfoCircle className="w-3 h-3" />
//           </div>
//           <span className="text-sm">{value.description}</span>
//         </div>
//       )}
//     </Combobox>
//   )
// }
