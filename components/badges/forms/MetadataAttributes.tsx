

// import { useEffect, useId, useMemo } from 'react'
// import { FaMinus, FaPlus } from 'react-icons/fa'
// import { useInputState } from './formInput.hooks'
// import { FormControl } from './formControl'
// import { TraitTypeInput, TraitValueInput } from './formInput'



// export interface Attribute {
//   trait_type: string
//   value: string
// }

// export interface MetadataAttributesProps {
//   title: string
//   subtitle?: string
//   isRequired?: boolean
//   attributes: [string, Attribute][]
//   onAdd: () => void
//   onChange: (key: string, attribute: Attribute) => void
//   onRemove: (key: string) => void
// }

// export function MetadataAttributes(props: MetadataAttributesProps) {
//   const { title, subtitle, isRequired, attributes, onAdd, onChange, onRemove } = props

//   return (
//     <FormControl isRequired={isRequired} subtitle={subtitle} title={title}>
//       {attributes.map(([id], i) => (
//         <MetadataAttribute
//           key={`ma-${id}`}
//           defaultAttribute={attributes[i][1]}
//           id={id}
//           isLast={i === attributes.length - 1}
//           onAdd={onAdd}
//           onChange={onChange}
//           onRemove={onRemove}
//         />
//       ))}
//     </FormControl>
//   )
// }

// export interface MetadataAttributeProps {
//   id: string
//   isLast: boolean
//   onAdd: MetadataAttributesProps['onAdd']
//   onChange: MetadataAttributesProps['onChange']
//   onRemove: MetadataAttributesProps['onRemove']
//   defaultAttribute: Attribute
// }

// export function MetadataAttribute({ id, isLast, onAdd, onChange, onRemove, defaultAttribute }: MetadataAttributeProps) {
//   const Icon = useMemo(() => (isLast ? FaPlus : FaMinus), [isLast])

//   const htmlId = useId()

//   const traitTypeState = useInputState({
//     id: `ma-trait_type-${htmlId}`,
//     name: `ma-trait_type-${htmlId}`,
//     title: `Trait Type`,
//     defaultValue: defaultAttribute.trait_type,
//   })

//   const traitValueState = useInputState({
//     id: `ma-trait_value-${htmlId}`,
//     name: `ma-trait_value-${htmlId}`,
//     title: `Trait Value`,
//     defaultValue: defaultAttribute.value,
//   })

//   useEffect(() => {
//     onChange(id, { trait_type: traitTypeState.value, value: traitValueState.value })
//   }, [traitTypeState.value, traitValueState.value, id])

//   return (
//     <div className="grid relative xl:grid-cols-[6fr_6fr_1fr] xl:-space-x-8 2xl:space-x-2">
//       <TraitTypeInput className="lg:w-4/5 2xl:w-full" {...traitTypeState} />
//       <TraitValueInput className="lg:w-4/5 xl:pr-2 xl:w-full" {...traitValueState} />

//       <div className="flex justify-end items-end pb-2 w-8">
//         <button
//           className="flex justify-center items-center p-2 bg-stargaze-80 hover:bg-plumbus-60 rounded-full"
//           onClick={(e) => {
//             e.preventDefault()
//             isLast ? onAdd() : onRemove(id)
//           }}
//           type="button"
//         >
//           <Icon className="w-3 h-3" />
//         </button>
//       </div>
//     </div>
//   )
// }
