// import { useMemo, useState } from 'react'


// import type { Address } from './AddressList'
// import { uid } from '../utils/random'

// export function useAddressListState() {
//   const [record, setRecord] = useState<Record<string, Address>>(() => ({
//     [uid()]: { address: '' },
//   }))

//   const entries = useMemo(() => Object.entries(record), [record])
//   const values = useMemo(() => Object.values(record), [record])

//   function add(balance: Address = { address: '' }) {
//     setRecord((prev) => ({ ...prev, [uid()]: balance }))
//   }

//   function update(key: string, balance = record[key]) {
//     setRecord((prev) => ({ ...prev, [key]: balance }))
//   }

//   function remove(key: string) {
//     return setRecord((prev) => {
//       const latest = { ...prev }
//       delete latest[key]
//       return latest
//     })
//   }

//   function reset() {
//     setRecord({})
//   }

//   return { entries, values, add, update, remove, reset }
// }
