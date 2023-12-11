import { assets } from 'chain-registry';
import { AssetList, Asset } from '@chain-registry/types';

export interface MappedCoin {
  readonly denom: string
  readonly fractionalDigits: number
}

export const defaultChainName = 'terpnetwork';

export const getCoin = (chainName: string = defaultChainName) => {
  const chainAssets = getChainAssets(chainName);
  return chainAssets.assets[0] as Asset;
};

export const getChainAssets = (chainName: string = defaultChainName) => {
  return assets.find((chain) => chain.chain_name === chainName) as AssetList;
};

export const getExponent = (chainName: string) => {
  return getCoin(chainName).denom_units.find(
    (unit) => unit.denom === getCoin(chainName).display
  )?.exponent as number;
};

export type CoinMap = Readonly<Record<string, MappedCoin>>

export interface FeeOptions {
  upload: number
  exec: number
  init: number
}

export interface AppConfig {
  readonly chainId: string
  readonly chainName: string
  readonly addressPrefix: string
  readonly rpcUrl: string
  readonly httpUrl?: string
  readonly faucetUrl?: string
  readonly feeToken: string
  readonly bondToken: string
  readonly coinMap: CoinMap
  readonly gasPrice: number
  readonly fees: FeeOptions
  readonly codeId?: number
}
