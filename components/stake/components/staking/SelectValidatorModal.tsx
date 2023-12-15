import {
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  TableContainer,
  Text,
  useColorMode,
  UseDisclosureReturn,
} from '@chakra-ui/react';
import { Token } from './Overview';

import { getStakingCoin } from '@/config';
import { ChainName } from '@cosmos-kit/core';
import { Logo } from './ModalElements';
import { type ExtendedValidator as Validator } from '@/components/utils';
import { shiftDigits } from '@/components/utils';
import { Dialog, DialogContent, DialogHeader, DialogOverlay } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';

export const SelectValidatorModal = ({
  allValidators,
  chainName,
  logos,
  handleValidatorClick,
  modalControl,
}: {
  allValidators: Validator[];
  chainName: ChainName;
  handleValidatorClick: (validator: Validator) => void;
  modalControl: UseDisclosureReturn;
  logos: {
    [key: string]: string;
  };
}) => {
  const coin = getStakingCoin(chainName);
  const { colorMode } = useColorMode();
  // const hasApr = !!allValidators[0].apr;

  return (
    <Dialog
      open={modalControl.isOpen}
      onOpenChange={modalControl.onClose}
    >
      <DialogOverlay />
      <DialogContent>
        <DialogHeader>Redelegate to</DialogHeader>
        {/* <ModalCloseButton /> */}

        <div>
          <TableContainer maxH={600} overflowY="scroll">
            <Table variant="simple">
              <Thead>
                <Tr>
                  <Th>Validator</Th>
                  <Th>Voting Power    Commission APR</Th>
                </Tr>
              </Thead>
              <Tbody>
                {allValidators.map((validator: Validator, index: number) => (
                  <Tr
                    key={validator.address}
                    onClick={() => handleValidatorClick(validator)}
                    _hover={{
                      background:
                        colorMode === 'light' ? 'gray.100' : 'gray.800',
                      cursor: 'pointer',
                    }}
                  >
                    <Td>
                      <Badge>
                        <Text mr={4}>{index + 1}</Text>
                        <Logo
                          identity={validator.identity}
                          name={validator.name}
                          logoUrl={logos[validator.address]}
                        /> 
                        &nbsp;
                        <Text>{validator.name}</Text>
                      </Badge>
                    </Td>
                    <Td>
                    <Badge>
                      {validator.votingPower.toLocaleString()}&nbsp;
                      <Token color="blackAlpha.800" token={coin.symbol} />
                      </Badge>
                    <Badge >
                    {shiftDigits(validator.commission, -16)}%
                    <br/>
                      {-(shiftDigits(validator.apr, -16)) + '%'} 
                      </Badge>
                    </Td>
                  </Tr>
                ))}
              </Tbody>
            </Table>
          </TableContainer>
        </div>
      </DialogContent>
    </Dialog>
  );
};
