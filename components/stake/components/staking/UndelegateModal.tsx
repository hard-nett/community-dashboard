import {
  Button,
  Stack,
  UseDisclosureReturn,
} from '@chakra-ui/react';
import { ValidatorInfo, StatBox, UndelegateWarning } from './ModalElements';
import {
  isGreaterThanZero,
  shiftDigits,
  type ExtendedValidator as Validator,
} from '@/components/utils';
import { useState } from 'react';
import { cosmos } from 'interchain-query';
import { useChain } from '@cosmos-kit/react';
import { getStakingCoin, getExponent } from '@/config';
import { ChainName } from '@cosmos-kit/core';
import { useInputBox } from '@/hooks/useInputBox';
import { useTx } from '@/hooks/useTx';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogOverlay } from '@/components/ui/dialog';

const { undelegate } = cosmos.staking.v1beta1.MessageComposer.fromPartial;

export const UndelegateModal = ({
  updateData,
  unbondingDays,
  chainName,
  logoUrl,
  selectedValidator,
  closeOuterModal,
  modalControl,
}: {
  updateData: () => void;
  unbondingDays: string;
  chainName: ChainName;
  selectedValidator: Validator;
  closeOuterModal: () => void;
  modalControl: UseDisclosureReturn;
  logoUrl: string;
}) => {
  const [isUndelegating, setIsUndelegating] = useState(false);
  const { address } = useChain(chainName);
  const { tx } = useTx(chainName);

  const coin = getStakingCoin(chainName);
  const exp = getExponent(chainName);

  const {
    renderInputBox: renderUndelegateInputBox,
    amount: undelegateAmount,
    setAmount: setUndelegateAmount,
  } = useInputBox(selectedValidator.delegation);

  const closeUndelegateModal = () => {
    setUndelegateAmount('');
    setIsUndelegating(false);
    modalControl.onClose();
  };

  const onUndelegateClick = async () => {
    setIsUndelegating(true);

    if (!address) return;

    const msg = undelegate({
      delegatorAddress: address,
      validatorAddress: selectedValidator.address,
      amount: {
        amount: shiftDigits(undelegateAmount, exp),
        denom: coin.base,
      },
    });

    await tx([msg], {
      onSuccess: () => {
        updateData();
        closeOuterModal();
        closeUndelegateModal();
      },
    });

    setIsUndelegating(false);
  };

  return (
    <Dialog open={modalControl.isOpen} onOpenChange={modalControl.onClose} >
      <DialogOverlay />
      <DialogContent>
        <DialogHeader>Undelegate</DialogHeader>
        {/* <ModalCloseButton /> */}
        <div>
          <ValidatorInfo
            logoUrl={logoUrl}
            name={selectedValidator.name}
            commission={shiftDigits(selectedValidator.commission, 2)}
            apr={selectedValidator.apr}
          />
          <Stack direction="column" spacing={4}>
            <UndelegateWarning unbondingDays={unbondingDays} />
            <StatBox
              label="Your Delegation"
              amount={selectedValidator.delegation}
              token={coin.symbol}
            />
            {renderUndelegateInputBox('Amount to Undelegate', coin.symbol)}
          </Stack>
        </div>
        <DialogFooter>
          <Button
            colorScheme="primary"
            onClick={onUndelegateClick}
            isLoading={isUndelegating}
            isDisabled={!isGreaterThanZero(undelegateAmount) || isUndelegating}
          >
            Undelegate
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
