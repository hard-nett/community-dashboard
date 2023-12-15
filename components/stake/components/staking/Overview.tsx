import {
  Stat,
  StatNumber,
  StatGroup,
  Button,
  useColorModeValue,
  Text,
} from '@chakra-ui/react';
import { useChain } from '@cosmos-kit/react';
import { useState } from 'react';
import { cosmos } from 'interchain-query';

import { ChainName } from '@cosmos-kit/core';

import { type ParsedRewards as Rewards } from '@/utils/staking';

import { getFeeCoin, getStakingCoin } from '@/config';
import { useTx } from '@/hooks/useTx';
import { isGreaterThanZero, sum } from '@/components/utils';
import { Badge } from '@/components/ui/badge';

const { withdrawDelegatorReward } =
  cosmos.distribution.v1beta1.MessageComposer.fromPartial;

export const Token = ({ token, color }: { token: string; color?: string }) => (
  <Text
    fontSize="sm"
    as="span"
    color={useColorModeValue(color || 'blackAlpha.600', 'whiteAlpha.600')}
  >
    {token}
  </Text>
);

const Overview = ({
  balance,
  rewards,
  staked,
  updateData,
  chainName,
}: {
  balance: string;
  rewards: Rewards;
  staked: string;
  updateData: () => void;
  chainName: ChainName;
}) => {
  const [isClaiming, setIsClaiming] = useState(false);
  const { address } = useChain(chainName);
  const { tx } = useTx(chainName);

  const totalAmount = sum(balance, staked, rewards.total);
  const coin = getStakingCoin(chainName);
  const feeCoin = getFeeCoin(chainName);

  const onClaimRewardClick = async () => {
    setIsClaiming(true);

    if (!address) return;

    const msgs = rewards.byValidators.map(({ validatorAddress }) =>
      withdrawDelegatorReward({
        delegatorAddress: address,
        validatorAddress,
      })
    );

    await tx(msgs, {
      onSuccess: updateData,
    });

    setIsClaiming(false);
  };

  return (
    <StatGroup>
      <Stat py={2} minWidth="200px">
        <Badge
          // color={useColorModeValue('blackAlpha.600', 'whiteAlpha.600')}
        >
          Total {coin.symbol} Amount
        </Badge>
        <StatNumber>
          {totalAmount}&nbsp;
          <Token token={coin.symbol} />
        </StatNumber>
      </Stat>

      <Stat py={2} minWidth="200px">
        <Badge
          // color={useColorModeValue('blackAlpha.600', 'whiteAlpha.600')}
        >
          Available Balance
        </Badge>
        <StatNumber>
          {balance} <Token token={coin.symbol} />
        </StatNumber>
      </Stat>

      <Stat py={2} minWidth="200px">
        <Badge
          // color={useColorModeValue('blackAlpha.600', 'whiteAlpha.600')}
        >
          Staked Amount
        </Badge>
        <StatNumber>
          {staked}&nbsp;
          <Token token={coin.symbol} />
        </StatNumber>
      </Stat>

      <Stat
        pos="relative"
        py={2}
        px={4}
        bgColor={useColorModeValue('purple.50', 'purple.700')}
        borderRadius={10}
        minWidth="200px"
      >
        <Badge
          // color={useColorModeValue('blackAlpha.600', 'whiteAlpha.600')}
        >
          Claimable Rewards
        </Badge>
        <StatNumber>
          {rewards.total}&nbsp;
          <Token
            // color={useColorModeValue('blackAlpha.600', 'whiteAlpha.600')}
            token={feeCoin.symbol}
          />
        </StatNumber>
        <Button
          pos="absolute"
          right={4}
          top={5}
          colorScheme="purple"
          size="sm"
          onClick={onClaimRewardClick}
          isDisabled={!isGreaterThanZero(rewards.total)}
          isLoading={isClaiming}
        >
          Claim
        </Button>
      </Stat>
    </StatGroup>
  );
};

export default Overview;
