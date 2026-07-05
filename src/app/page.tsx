"use client";

import { Box, Button, Container, Grid, GridItem, HStack, Heading, Stack, Text, VStack } from "@chakra-ui/react";
import NextLink from "next/link";

export default function Landing() {
  return (
    <Box bg="background" minHeight="calc(100vh - 76px)">
      <Hero />
      <FeatureRow />
      <FlowExample />
      <Footer />
    </Box>
  );
}

function Hero() {
  return (
    <Container maxWidth="1100px" mx="auto" px={{ base: 6, md: 12 }} pt={{ base: 12, md: 24 }} pb={{ base: 12, md: 20 }}>
      <VStack align="start" gap={6} maxWidth="720px">
        <Text fontSize="sm" fontWeight="600" color="primary" letterSpacing="wider">
          FICSIT PLANNING TOOL
        </Text>
        <Heading as="h1" size={{ base: "2xl", md: "4xl" }} lineHeight="1.1">
          Plan Satisfactory factories by <Text as="span" color="primary">target rate.</Text>
        </Heading>
        <Text fontSize="lg" color="fg.muted" maxWidth="640px">
          Pick a product, enter a parts-per-minute target, and get the raw resources, machine
          counts, and full recipe tree. Includes alternate recipes when they use fewer raw ores.
        </Text>
        <HStack gap={3} pt={2}>
          <NextLink href="/calculator" passHref>
            <Button size="lg" bg="primary" color="white" _hover={{ opacity: 0.9 }}>
              Open the calculator →
            </Button>
          </NextLink>
          <NextLink href="https://github.com/singkomitra/satisfactory-calculator" passHref>
            <Button size="lg" variant="outline">
              View source
            </Button>
          </NextLink>
        </HStack>
      </VStack>
    </Container>
  );
}

const features = [
  {
    title: "Target-rate math",
    body: "Set your desired output in parts/min. The tool solves every recipe in the chain — no manual multiplication."
  },
  {
    title: "Alternate recipe strategies",
    body: "Compare the default recipe against a min-raw strategy that picks alternate recipes to minimize total raw ores."
  },
  {
    title: "Machine counts per building",
    body: "Constructor, Assembler, Foundry, Refinery, Packager — see how many of each you need at the target rate."
  }
];

function FeatureRow() {
  return (
    <Container maxWidth="1100px" mx="auto" px={{ base: 6, md: 12 }} pb={16}>
      <Grid templateColumns={{ base: "1fr", md: "repeat(3, 1fr)" }} gap={6}>
        {features.map((f) => (
          <GridItem key={f.title}>
            <VStack
              align="start"
              gap={2}
              p={6}
              borderWidth="1px"
              borderColor="border.subtle"
              borderRadius="lg"
              bg="bg.panel"
              height="100%"
            >
              <Heading size="sm">{f.title}</Heading>
              <Text color="fg.muted" fontSize="sm">
                {f.body}
              </Text>
            </VStack>
          </GridItem>
        ))}
      </Grid>
    </Container>
  );
}

function FlowExample() {
  const steps = [
    { label: "Iron Ore", meta: "raw", tone: "orange" },
    { label: "Iron Ingot", meta: "Smelter", tone: "blue" },
    { label: "Iron Plate", meta: "Constructor", tone: "blue" },
    { label: "Reinforced Iron Plate", meta: "Assembler", tone: "blue" },
    { label: "Modular Frame", meta: "Assembler", tone: "green" }
  ];

  return (
    <Container maxWidth="1100px" mx="auto" px={{ base: 6, md: 12 }} pb={16}>
      <Stack
        p={{ base: 6, md: 8 }}
        borderWidth="1px"
        borderColor="border.subtle"
        borderRadius="xl"
        bg="bg.panel"
        gap={6}
      >
        <VStack align="start" gap={1}>
          <Heading size="md">How the chain looks</Heading>
          <Text color="fg.muted" fontSize="sm">
            Every product is a node. Every arrow carries a rate in parts/min. Machines process
            the material between them.
          </Text>
        </VStack>

        <Box overflowX="auto" pb={2}>
          <HStack gap={0} minWidth="fit-content" align="stretch">
            {steps.map((step, i) => (
              <HStack key={step.label} gap={0} align="stretch">
                <VStack
                  gap={1}
                  px={4}
                  py={4}
                  borderWidth="1px"
                  borderColor={`${step.tone}.400`}
                  bg={`${step.tone}.50`}
                  _dark={{ bg: `${step.tone}.900`, borderColor: `${step.tone}.700` }}
                  borderRadius="lg"
                  minWidth="150px"
                  align="start"
                  justify="center"
                >
                  <Text fontWeight="600" fontSize="sm">
                    {step.label}
                  </Text>
                  <Text fontSize="xs" color="fg.muted">
                    {step.meta}
                  </Text>
                </VStack>
                {i < steps.length - 1 && (
                  <VStack gap={0} justify="center" px={2}>
                    <Text fontSize="xs" color="fg.muted" fontFamily="mono">
                      →
                    </Text>
                  </VStack>
                )}
              </HStack>
            ))}
          </HStack>
        </Box>

        <Text fontSize="xs" color="fg.muted">
          A node-graph visualization of these relationships is planned next — the calculator
          already emits nodes and edges internally.
        </Text>
      </Stack>
    </Container>
  );
}

function Footer() {
  return (
    <Container maxWidth="1100px" mx="auto" px={{ base: 6, md: 12 }} pb={12}>
      <Text fontSize="xs" color="fg.muted">
        Uses in-game recipe data. Not affiliated with Coffee Stain Studios.
      </Text>
    </Container>
  );
}
