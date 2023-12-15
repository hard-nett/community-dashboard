import React from 'react';
import {
  Button,
  UseDisclosureReturn,
} from '@chakra-ui/react';
import { ValidatorInfo, ValidatorDesc, StatBox } from './ModalElements';

import { ChainName } from '@cosmos-kit/core';
import { shiftDigits, type ExtendedValidator as Validator } from '@/components/utils';
import { getStakingCoin } from '@/config';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogOverlay } from '@/components/ui/dialog';

export const ValidatorInfoModal = ({
  chainName,
  logoUrl,
  handleClick,
  modalControl,
  selectedValidator,
}: {
  chainName: ChainName;
  modalControl: UseDisclosureReturn;
  selectedValidator: Validator;
  handleClick: {
    openDelegateDialog: () => void;
    openUndelegateModal: () => void;
    openSelectValidatorModal: () => void;
  };
  logoUrl: string;
}) => {
  const coin = getStakingCoin(chainName);

  const { isOpen, onClose } = modalControl;
  const { openDelegateDialog, openSelectValidatorModal, openUndelegateModal } =
    handleClick;

  return (
    <Dialog open={isOpen} onOpenChange={onClose} size="2xl" isCentered>
      <DialogOverlay />
      <DialogContent>
        <DialogHeader>Validator</DialogHeader>
        {/* <ModalCloseButton /> */}

        <div>
          <ValidatorInfo
            logoUrl={logoUrl}
            name={selectedValidator.name}
            commission={shiftDigits(selectedValidator.commission, 2)}
            apr={selectedValidator.apr}
          />
          <ValidatorDesc description={selectedValidator.description} />
          <StatBox
            label="Your Delegation"
            amount={selectedValidator.delegation}
            token={coin.symbol}
          />
        </div>

        <DialogFooter>
          <Button colorScheme="gray" onClick={openUndelegateModal} mr={4}>
            Undelegate
          </Button>
          <Button
            colorScheme="gray"
            onClick={() => {
              openSelectValidatorModal();
              onClose();
            }}
            mr={4}
          >
            Redelegate
          </Button>
          <Button colorScheme="primary" onClick={openDelegateDialog}>
            Delegate
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
