import {
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  TableContainer,
  Button,
  Box,
  Icon,
  Text,
  useColorMode,
} from '@chakra-ui/react';

import { IoArrowForward } from 'react-icons/io5';
import { Dispatch, SetStateAction } from 'react';

import { ChainName } from '@cosmos-kit/core';
import React from 'react';
import { Logo } from './ModalElements';
import { type ExtendedValidator as Validator } from '@/components/utils';
import { getStakingCoin, getFeeCoin, } from '@/config';
import { Badge } from '@/components/ui/badge';

const MyValidatorsList = ({
  myValidators,
  openModal,
  chainName,
  logos,
  setSelectedValidator,
}: {
  myValidators: Validator[];
  chainName: ChainName;
  openModal: () => void;
  setSelectedValidator: Dispatch<SetStateAction<Validator | undefined>>;
  logos: {
    [key: string]: string;
  };
}) => {
  const coin = getStakingCoin(chainName);
  const feecoin = getFeeCoin(chainName);

  const { colorMode } = useColorMode();

  return (
    <TableContainer>
      <Table variant="simple">
        <Thead>
          <Tr>
            <Th>Validator</Th>
            <Th>Amount Staked</Th>
            <Th>Claimable Rewards</Th>
          </Tr>
        </Thead>
        <Tbody>
          {myValidators.map((validator, index) => (
            <Tr key={validator.name}>
              <Td>
              <Badge className='flex'>
                  <Text padding={4}>{index + 1}</Text>
                  <Logo
                    identity={validator.identity}
                    name={validator.name}
                    logoUrl={logos[validator.address]}
                  />
                     &nbsp;
              {validator.name}
              </Badge>
              </Td>
              <Td>
                <Badge>
                {validator.delegation}&nbsp; {coin.symbol} 
                </Badge>
              </Td>
              <Td>
                <Box width="100%" display="flex" alignItems="center">
                  <Badge>
                    {validator.reward}&nbsp;{feecoin.symbol}
                  </Badge>
                  <Button
                    variant="ghost"
                    ml="auto"
                    onClick={() => {
                      openModal();
                      setSelectedValidator(validator);
                    }}
                    color={colorMode === 'light' ? 'purple.600' : 'purple.200'}
                  >
                       <Badge>
                    manage
                    <Icon as={IoArrowForward} />
                  </Badge>
                    </Button> 
                </Box>
              </Td>
            </Tr>
          ))}
        </Tbody>
      </Table>
    </TableContainer>
  );
};

export default React.memo(MyValidatorsList);
