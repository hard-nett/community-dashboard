import { Heading, useDisclosure } from '@chakra-ui/react';
import { useState } from 'react';
import { ChainName } from '@cosmos-kit/core';

import React from 'react';
import AllValidatorsList from './AllValidatorsList';
import { type ExtendedValidator as Validator } from '@/components/utils';
import { DelegateDialog } from './DelegateDialog';

export const AllValidators = ({
  validators,
  balance,
  updateData,
  unbondingDays,
  chainName,
  logos,
}: {
  validators: Validator[];
  balance: string;
  updateData: () => void;
  unbondingDays: string;
  chainName: ChainName;
  logos: {
    [key: string]: string;
  };
}) => {
  const delegateModalControl = useDisclosure();
  const [selectedValidator, setSelectedValidator] = useState<Validator>();

  return (
    <>
      <Heading as="h4" size="md" mt={12} mb={6}>
        All Validators
      </Heading>

      <AllValidatorsList
        validators={validators}
        chainName={chainName}
        logos={logos}
        openModal={delegateModalControl.onOpen}
        setSelectedValidator={setSelectedValidator}
      />

      {selectedValidator && (
        <DelegateDialog
          balance={balance}
          updateData={updateData}
          unbondingDays={unbondingDays}
          chainName={chainName}
          logoUrl={logos[selectedValidator.address]}
          modalControl={delegateModalControl}
          selectedValidator={selectedValidator}
          modalTitle="Validator"
        />
      )}
    </>
  );
};
