"use client";

import { HStack, Heading, Link as ChakraLink, Box } from "@chakra-ui/react";
import { observer } from "mobx-react-lite";
import NextLink from "next/link";
import { usePathname } from "next/navigation";

const links = [
  { href: "/", label: "Home" },
  { href: "/calculator", label: "Calculator" }
];

const NavBar = observer(function NavBar() {
  const pathname = usePathname();

  return (
    <HStack width="100%" px={{ base: 6, md: 12 }} py={4} bg="navbar" color="white" gap={8}>
      <NextLink href="/" style={{ textDecoration: "none" }}>
        <HStack gap={2}>
          <Box width="10px" height="10px" borderRadius="full" bg="primary" />
          <Heading size="md" color="white">
            Satisfactory Calculator
          </Heading>
        </HStack>
      </NextLink>
      <HStack gap={2} ml={6}>
        {links.map((link) => {
          const active = link.href === "/" ? pathname === "/" : pathname.startsWith(link.href);
          return (
            <ChakraLink
              key={link.href}
              as={NextLink}
              href={link.href}
              px={3}
              py={1.5}
              borderRadius="md"
              fontSize="sm"
              fontWeight="500"
              color={active ? "white" : "whiteAlpha.700"}
              bg={active ? "whiteAlpha.200" : "transparent"}
              _hover={{ bg: "whiteAlpha.100", color: "white", textDecoration: "none" }}
            >
              {link.label}
            </ChakraLink>
          );
        })}
      </HStack>
    </HStack>
  );
});

export default NavBar;
