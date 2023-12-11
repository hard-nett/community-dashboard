import React from 'react';
import {
  Button,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  UseDisclosureReturn,
} from '@chakra-ui/react';
import { ValidatorInfo, ValidatorDesc, StatBox } from './ModalElements';

import { ChainName } from '@cosmos-kit/core';
import { shiftDigits, type ExtendedValidator as Validator } from '@/components/utils';
import { getCoin } from '@/config';

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
  const coin = getCoin(chainName);

  const { isOpen, onClose } = modalControl;
  const { openDelegateDialog, openSelectValidatorModal, openUndelegateModal } =
    handleClick;

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="2xl" isCentered>
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>Validator</ModalHeader>
        <ModalCloseButton />

        <ModalBody>
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
        </ModalBody>

        <ModalFooter>
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
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};
