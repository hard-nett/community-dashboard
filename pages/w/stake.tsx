import { Divider } from '@chakra-ui/react';
import { defaultChainName } from '@/config';
import { Layout, StakingSection } from '@/components/stake/components';
import NoSSR from 'react-no-ssr';


export default function SingleChain() {
  return (
    <Layout>
      {/* <WalletSection isMultiChain={false} /> */}
      <Divider />
      <NoSSR>
        <StakingSection chainName={defaultChainName} />
      </NoSSR>
    </Layout>
  );
}
