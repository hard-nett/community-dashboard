import { proofData } from 'lib/headstash'
import { useEffect, useState } from 'react'

const ProofComponent = ({
  isConnected,
  eth_pubkey,
  walletAddress
}: {
  isConnected: boolean
  eth_pubkey: string
  walletAddress: string
}) => {
  const [proofs, setProofs] = useState<string[]>([])

  useEffect(() => {
    const fetchProofs = async (eth_pubkey: string) => {
      try {
        if (isConnected && eth_pubkey) {
          const matchedData = proofData.find((data) => data.address === eth_pubkey)
          if (matchedData) {
            setProofs(matchedData.proof)
          } else {
            setProofs(['No proofs were found'])
          }
        }
      } catch (error) {
        console.error('Error fetching Proof data', error)
        setProofs(['Error fetching data'])
      }
    }

    void fetchProofs(eth_pubkey)
  }, [isConnected, eth_pubkey])

  return (
    <div>
      <h2>Proofs</h2>
      {proofs.length > 0 ? (
        <ul>
          {proofs.map((proof, index) => (
            <li key={index}>{proof}</li>
          ))}
        </ul>
      ) : (
        <p>No proofs available.</p>
      )}
    </div>
  )
}

export default ProofComponent
