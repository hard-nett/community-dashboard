import { ChangeEvent, useState } from 'react';
import { StatBox } from '@/components/stake/components/staking/ModalElements';
import { Input } from '@/components/ui/input';
import { PageHeaderDescription } from '@/components/utils/page-header';
import { Badge } from '@/components/ui/badge';
import { Button } from '@interchain-ui/react';

export const InputBox = ({
  label,
  token,
  value,
  onChange,
  onMaxClick,
  isMaxBtnLoading = false,
}: {
  label: string;
  token: string;
  value: number | string;
  onChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onMaxClick: () => void;
  isMaxBtnLoading?: boolean;
}) => (
  <StatBox
    label={label}
    token={token}
    input={
<>
        <Input type="number" value={value} onChange={onChange} />
        <div
className='mr-3 width-24'
        >
          <Button
            // w="42px"
            // h="22px"
            // fontSize="12px"
            // borderRadius="4px"
            // color="white"
            // variant="default"
            // colorScheme="cyan"
            // fontWeight="bold"
            disabled={isMaxBtnLoading}
            onClick={onMaxClick}
            isLoading={isMaxBtnLoading}
            // _hover={{ cursor: 'pointer' }}
          >
            MAX
          </Button>
          <Badge >
            {token}
          </Badge>
        </div>
</>
    }
  />
);

export const useInputBox = (maxAmount?: number | string) => {
  const [amount, setAmount] = useState<number | string>('');
  const [max, setMax] = useState<number | string>(maxAmount || 0);

  const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (Number(e.target.value) > Number(max)) {
      setAmount(max);
      return;
    }

    if (e.target.value === '') {
      setAmount('');
      return;
    }

    setAmount(+Number(e.target.value).toFixed(6));
  };

  const renderInputBox = (
    label: string,
    token: string,
    onMaxClick?: () => void,
    isLoading?: boolean
  ) => {
    return (
      <InputBox
        label={label}
        token={token}
        value={amount}
        isMaxBtnLoading={isLoading}
        onChange={(e) => handleInputChange(e)}
        onMaxClick={() => (onMaxClick ? onMaxClick() : setAmount(max))}
      />
    );
  };

  return { renderInputBox, amount, setAmount, setMax };
};
