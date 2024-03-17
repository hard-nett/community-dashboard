import { CosmWasmClient } from '@cosmjs/cosmwasm-stargate';
class AtlasCosmWasmClient extends CosmWasmClient {
  constructor(tmClient) {
    super(tmClient);
  }
}
export { AtlasCosmWasmClient };
