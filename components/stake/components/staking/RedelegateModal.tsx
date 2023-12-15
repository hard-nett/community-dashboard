import {
  Button,
  Stack,
  Text,
  UseDisclosureReturn,
} from '@chakra-ui/react';
import { StatBox } from './ModalElements';
import { useEffect, useState } from 'react';
import { cosmos } from 'interchain-query';
import { useChain } from '@cosmos-kit/react';
import { getStakingCoin, getExponent } from '@/config';
import { ChainName } from '@cosmos-kit/core';
import { isGreaterThanZero, shiftDigits, type ExtendedValidator as Validator } from '@/components/utils';
import { useTx } from '@/hooks/useTx';
import { useInputBox } from '@/hooks/useInputBox';
import { Dialog, DialogContent, DialogFooter, DialogOverlay } from '@/components/ui/dialog';

const { beginRedelegate } = cosmos.staking.v1beta1.MessageComposer.fromPartial;

export const RedelegateModal = ({
  updateData,
  chainName,
  modalControl,
  selectedValidator,
  validatorToRedelegate,
}: {
  updateData: () => void;
  chainName: ChainName;
  selectedValidator: Validator;
  validatorToRedelegate: Validator;
  modalControl: UseDisclosureReturn;
}) => {
  const { address } = useChain(chainName);

  const [isRedelegating, setIsRedelegating] = useState(false);

  const coin = getStakingCoin(chainName);
  const exp = getExponent(chainName);

  const { tx } = useTx(chainName);

  const {
    amount: redelegateAmount,
    setAmount: setRedelegateAmount,
    renderInputBox: renderRedelegateInputBox,
    setMax: setMaxRedelegateAmount,
  } = useInputBox(selectedValidator.delegation);

  useEffect(() => {
    setMaxRedelegateAmount(selectedValidator.delegation);
  }, [selectedValidator, setMaxRedelegateAmount]);

  const closeRedelegateModal = () => {
    setRedelegateAmount('');
    setIsRedelegating(false);
    modalControl.onClose();
  };

  const onRedelegateClick = async () => {
    setIsRedelegating(true);

    if (!address) return;

    const msg = beginRedelegate({
      delegatorAddress: address,
      validatorSrcAddress: selectedValidator.address,
      validatorDstAddress: validatorToRedelegate.address,
      amount: {
        denom: coin.base,
        amount: shiftDigits(redelegateAmount, exp),
      },
    });

    await tx([msg], {
      onSuccess: () => {
        updateData();
        closeRedelegateModal();
      },
    });

    setIsRedelegating(false);
  };

  return (
    <Dialog
      open={modalControl.isOpen}
      onOpenChange={closeRedelegateModal}
    >
      <DialogOverlay />
      <DialogContent>
        {/* <ModalCloseButton /> */}
        <div>
          <Stack direction="row" mt={8} mb={2}>
            <Text>From </Text>
            <Text size="lg" fontWeight="bold">
              {selectedValidator?.name}
            </Text>
          </Stack>
          <StatBox
            label="Your Delegation"
            amount={selectedValidator?.delegation}
            token={coin.symbol}
          />

          <Stack direction="row" mt={8} mb={2}>
            <Text>To</Text>
            <Text size="lg" fontWeight="bold">
              {validatorToRedelegate.name}
            </Text>
          </Stack>
          {renderRedelegateInputBox('Amount to Redelegate', coin.symbol)}
        </div>

        <DialogFooter>
          <Button
            colorScheme="primary"
            onClick={onRedelegateClick}
            isLoading={isRedelegating}
            isDisabled={!isGreaterThanZero(redelegateAmount) || isRedelegating}
          >
            Redelegate
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
