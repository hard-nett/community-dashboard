import {
  Box,
  Heading,
  Text,
  Button,
  Flex,
  Icon,
  useColorMode,
  useColorModeValue,
} from '@chakra-ui/react';
import { BsFillMoonStarsFill, BsFillSunFill } from 'react-icons/bs';

const stacks = ['CosmosKit', 'Next.js'];

export const Header = () => {
  const { colorMode, toggleColorMode } = useColorMode();

  return (
    <>
      <Flex justifyContent="end" mb={4}>

      </Flex>
      <Box textAlign="center">
        <Heading
          as="h1"
          fontWeight="bold"
          fontSize={{ base: '2xl', sm: '3xl', md: '4xl' }}
        >
          <Text as="span">Secure Terp Network</Text>
 

        </Heading>
        <Text as="span">Learn more about staking here.</Text>
      </Box>
    </>
  );
};
