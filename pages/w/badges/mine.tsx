/* eslint-disable eslint-comments/disable-enable-pair */

/* eslint-disable @typescript-eslint/no-unsafe-member-access */

import { ContractPageHeader } from '@/components/badges/components/contractPageHeader'
import { Conditional } from '@/components/badges/utils/conditional'
import { API_URL, BADGE_HUB_ADDRESS, BLOCK_EXPLORER_URL, STARGAZE_URL } from '@/components/badges/utils/constants'
import { withMetadata } from '@/components/badges/utils/layout'
import { links } from '@/components/badges/utils/links'
import { Alert } from '@/components/ui/alert'
import axios from 'axios'



import type { NextPage } from 'next'
import { NextSeo } from 'next-seo'
import Link from 'next/link'
import { useCallback, useEffect, useState } from 'react'
import { FaSlidersH, FaUser } from 'react-icons/fa'



import { useWallet } from 'utils/wallet'

const BadgeList: NextPage = () => {
  const wallet = useWallet()
  const [myBadges, setMyBadges] = useState<any[]>([])

  useEffect(() => {
    const fetchBadges = async () => {
      await axios
        .get(`${API_URL}/api/v1beta/badges/${wallet.address || ''}`)
        .then((response) => {
          const badgeData = response.data
          setMyBadges(badgeData)
        })
        .catch(console.error)
    }
    fetchBadges().catch(console.error)
  }, [wallet.address])

  const renderTable = useCallback(() => {
    return (
      <div className="overflow-x-auto w-full">
        {myBadges.length > 0 && (
          <table className="table w-full">
            <thead>
              <tr>
                <th className="pl-36 text-lg font-bold text-left bg-black">Badge Name</th>
                <th className="text-lg font-bold bg-black">Badge Description</th>
                <th className="bg-black" />
              </tr>
            </thead>
            <tbody>
              {myBadges.map((badge: any, index: any) => {
                return (
                  <tr key={index}>
                    <td className="w-[35%] bg-black">
                      <div className="flex items-center space-x-3">
                        <div className="avatar">
                          <div className="w-28 h-28 mask mask-squircle">
                            <img
                              alt="badge-preview"
                              src={
                                (badge?.image as string).startsWith('ipfs')
                                  ? `https://ipfs-gw.stargaze-apis.com/ipfs/${(badge?.image as string).substring(7)}`
                                  : badge?.image
                              }
                            />
                          </div>
                        </div>
                        <div className="pl-2">
                          <p className="overflow-auto max-w-xs font-bold no-scrollbar ">
                            {badge.name ? badge.name : 'No name provided.'}
                          </p>
                          <p className="max-w-xs text-sm truncate opacity-50">Badge ID: {badge.tokenId}</p>
                        </div>
                      </div>
                    </td>
                    <td className="overflow-auto w-[55%] max-w-xl bg-black no-scrollbar">
                      {badge.description ? badge.description : 'No description provided.'}
                      {/* <br /> */}
                      {/* <span className="badge badge-ghost badge-sm"></span> */}
                    </td>
                    <th className="bg-black">
                      <div className="flex items-center space-x-8">
                        <Link
                          className="text-xl text-plumbus"
                          href={`/w/badges/manage?badgeHubContractAddress=${BADGE_HUB_ADDRESS}&badgeId=${
                            (badge.tokenId as string).split('|')[0]
                          }`}
                        >
                          <FaSlidersH />
                        </Link>

                        <Link
                          className="text-xl text-plumbus"

                          href={`${BLOCK_EXPLORER_URL}/profile/${wallet.address || ''}`}
                        >
                          <FaUser />
                        </Link>
                      </div>
                    </th>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>
    )
  }, [myBadges, wallet.address])

  return (
    <section className="py-6 px-12 space-y-4">
      <NextSeo title="My Badges" />
      <ContractPageHeader description="A list of your badges." link={links.Documentation} title="My Badges" />
      <hr />
      <div>{renderTable()}</div>
      <br />

      <Conditional test={myBadges.length === 0}>
        <Alert variant="default">You currently don&apos;t own any badges.</Alert>
      </Conditional>
    </section>
  )
}
export default withMetadata(BadgeList, { center: false })
