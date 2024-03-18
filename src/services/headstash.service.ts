import { axios } from 'context/axios'

export class HeadstashAmountService {
  static async requestProofs(address: string): Promise<HeadstashAmountResponse> {
    const { data } = await axios.get(`/getAmount/${address}`)
    return data
  }
}

export class HeadstashProofsService {
  static async requestProofs(address: string): Promise<ProofsResponse> {
    const { data } = await axios.get(`/getProofs/${address}`)
    return data
  }
}

export interface ProofsResponse {
  proofs: string[]
}

export interface HeadstashAmountResponse {
  amount: string
}
