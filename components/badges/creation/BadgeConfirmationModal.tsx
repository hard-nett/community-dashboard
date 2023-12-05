// import { Button } from '@/components/ui/button'
// import { useState } from 'react'



// export interface BadgeConfirmationModalProps {
//   confirm: () => void
// }
// export const BadgeConfirmationModal = (props: BadgeConfirmationModalProps) => {
//   const [isChecked, setIsChecked] = useState(false)
//   return (
//     <div>
//       <input className="modal-toggle" defaultChecked id="my-modal-2" type="checkbox" />
//       <label className="cursor-pointer modal" htmlFor="my-modal-2">
//         <label
//           className="absolute top-[23%] bottom-5 left-1/3 max-w-[600px] max-h-[410px] border-2 no-scrollbar modal-box"
//           htmlFor="temp"
//         >
//           {/* <Alert type="warning"></Alert> */}
//           <div className="text-xl font-bold">
//             <div className="text-sm font-thin">
//               You represent and warrant that you have, or have obtained, all rights, licenses, consents, permissions,
//               power and/or authority necessary to grant the rights granted herein for any content that you create,
//               submit, post, promote, or display on or through the Service. You represent and warrant that such contain
//               material subject to copyright, trademark, publicity rights, or other intellectual property rights, unless
//               you have necessary permission or are otherwise legally entitled to post the material and to grant Stargaze
//               Parties the license described above, and that the content does not violate any laws. Stargaze.zone
//               reserves the right to exercise its discretion in concealing user-generated content, should such content be
//               determined to have a detrimental impact on the brand.
//             </div>
//             <br />
//             <div className="flex flex-row pb-4">
//               <label className="flex flex-col space-y-1" htmlFor="terms">
//                 <span className="text-sm font-light text-white">I agree with the terms above.</span>
//               </label>
//               <input
//                 checked={isChecked}
//                 className="p-2 mb-1 ml-2"
//                 id="terms"
//                 name="terms"
//                 onClick={() => setIsChecked(!isChecked)}
//                 type="checkbox"
//               />
//             </div>
//             <br />
//             Are you sure to proceed with creating a new badge?
//           </div>
//           <div className="flex justify-end w-full">
//             <Button className="px-0 mt-4 mr-5 mb-4 max-h-12 bg-gray-600 hover:bg-gray-600">
//               <label
//                 className="w-full h-full text-white bg-gray-600 hover:bg-gray-600 rounded border-0 btn modal-button"
//                 htmlFor="my-modal-2"
//               >
//                 Go Back
//               </label>
//             </Button>
//             <Button className="px-0 mt-4 mb-4 max-h-12" onClick={props.confirm}>
//               <label
//                 className="w-full h-full text-white bg-plumbus hover:bg-plumbus-light border-0 btn modal-button"
//                 htmlFor="my-modal-2"
//               >
//                 Confirm
//               </label>
//             </Button>
//           </div>
//         </label>
//       </label>
//     </div>
//   )
// }
