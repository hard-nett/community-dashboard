import {
  Box,
  Divider,
  Text,
  Stack,
  Link,
} from '@chakra-ui/react';

// interface IFeature {
//   title: string;
//   text: string;
//   href: string;
// }

// const Product = ({ title, text, href }: IFeature) => {
//   return (
//     <Link href={href} target="_blank" _hover={{ textDecoration: 'none' }}>
//       <Stack
//         h="full"
//         minH={36}
//         p={5}
//         spacing={2.5}
//         justifyContent="center"
//         borderRadius={5}
//         boxShadow={useColorModeValue(
//           '0 2px 5px #ccc',
//           '0 1px 3px #727272, 0 2px 12px -2px #2f2f2f'
//         )}
//         _hover={{
//           color: useColorModeValue('purple.600', 'purple.300'),
//           boxShadow: useColorModeValue(
//             '0 2px 5px #bca5e9',
//             '0 0 3px rgba(150, 75, 213, 0.8), 0 3px 8px -2px rgba(175, 89, 246, 0.9)'
//           ),
//         }}
//       >
//         <Heading fontSize="xl">{title}&ensp;&rarr;</Heading>
//         <Text>{text}</Text>
//       </Stack>
//     </Link>
//   );
// };

// const Dependency = ({ title, text, href }: IFeature) => {
//   return (
//     <Link href={href} target="_blank" _hover={{ textDecoration: 'none' }}>
//       <Stack
//         isInline={true}
//         key={title}
//         spacing={3}
//         h="full"
//         p={4}
//         justifyContent="center"
//         borderRadius="md"
//         border="1px solid"
//         borderColor={useColorModeValue('blackAlpha.200', 'whiteAlpha.100')}
//         _hover={{
//           boxShadow: useColorModeValue(
//             '0 2px 5px #ccc',
//             '0 1px 3px #727272, 0 2px 12px -2px #2f2f2f'
//           ),
//         }}
//       >
//         <Box color={useColorModeValue('primary.500', 'primary.200')}>
//         </Box>
//         <Stack spacing={1}>
//           <Text fontSize="lg" fontWeight="semibold">
//             {title}
//           </Text>
//           <Text
//             lineHeight="short"
//             color={useColorModeValue('blackAlpha.700', 'whiteAlpha.700')}
//           >
//             {text}
//           </Text>
//         </Stack>
//       </Stack>
//     </Link>
//   );
// };

export const Footer = () => {
  return (
    <>

      <Box mb={3}>
        <Divider />
      </Box>
      <Stack
        isInline={true}
        spacing={1}
        justifyContent="center"
        opacity={0.5}
        fontSize="sm"
      >
        <Text>Built with</Text>
        <Link
          href="https://terp.network/"
          target="_blank"
          rel="noopener noreferrer"
        >
          Terp Network
        </Link>
      </Stack>
    </>
  );
};