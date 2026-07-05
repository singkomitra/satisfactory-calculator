"use client";

import { Box, HStack, VStack, Text, Heading } from "@chakra-ui/react";
import { observer } from "mobx-react-lite";
import { useContext } from "react";
import { context } from "@/state";

type RawOption = { id: string; label: string };

type Props = {
  isOpen: boolean;
  onClose: () => void;
  rawResourceOptions: RawOption[];
};

const ResourcesPanel = observer(function ResourcesPanel({ isOpen, onClose, rawResourceOptions }: Props) {
  const { state, actions } = useContext(context);
  if (!isOpen) return null;

  return (
    <>
      <Box
        position="fixed"
        inset={0}
        bg="rgba(0,0,0,0.4)"
        zIndex={40}
        onClick={onClose}
        style={{ backdropFilter: "blur(2px)" }}
      />
      <Box
        position="fixed"
        top={0}
        right={0}
        bottom={0}
        width={{ base: "100%", md: "380px" }}
        bg="#0f1420"
        borderLeft="1px solid"
        borderColor="whiteAlpha.200"
        zIndex={41}
        color="white"
        display="flex"
        flexDirection="column"
        boxShadow="-8px 0 24px rgba(0,0,0,0.35)"
      >
        <HStack justify="space-between" px={5} py={4} borderBottom="1px solid" borderColor="whiteAlpha.100">
          <Heading size="sm">Resources</Heading>
          <Box
            as="button"
            onClick={onClose}
            color="whiteAlpha.700"
            fontSize="lg"
            lineHeight="1"
            _hover={{ color: "white" }}
            cursor="pointer"
            px={2}
          >
            ×
          </Box>
        </HStack>

        <Box flex="1" overflowY="auto" px={5} py={4}>
          <Text fontSize="xs" color="whiteAlpha.600" mb={3}>
            Set a mode per raw resource. Excluded resources are treated as unavailable — recipes that transitively consume them are filtered out.
          </Text>

          <VStack align="stretch" gap={2}>
            {rawResourceOptions.map((r) => (
              <ResourceRow
                key={r.id}
                id={r.id}
                label={r.label}
                excluded={!!state.excludedResources[r.id]}
                onToggle={() => actions.toggleExcludedResource(r.id)}
              />
            ))}
          </VStack>
        </Box>

        <HStack
          px={5}
          py={3}
          borderTop="1px solid"
          borderColor="whiteAlpha.100"
          justify="space-between"
        >
          <Box
            as="button"
            onClick={actions.clearExcludedResources}
            fontSize="sm"
            color="whiteAlpha.700"
            cursor="pointer"
            _hover={{ color: "white" }}
          >
            Reset all
          </Box>
          <Box
            as="button"
            onClick={onClose}
            fontSize="sm"
            bg="primary"
            color="white"
            px={4}
            py={2}
            borderRadius="md"
            cursor="pointer"
            _hover={{ opacity: 0.9 }}
          >
            Done
          </Box>
        </HStack>
      </Box>
    </>
  );
});

function ResourceRow({
  id,
  label,
  excluded,
  onToggle
}: {
  id: string;
  label: string;
  excluded: boolean;
  onToggle: () => void;
}) {
  return (
    <HStack
      justify="space-between"
      p={2}
      borderRadius="md"
      borderWidth="1px"
      borderColor={excluded ? "primary" : "whiteAlpha.100"}
      bg={excluded ? "rgba(241,144,102,0.08)" : "transparent"}
      _hover={{ borderColor: excluded ? "primary" : "whiteAlpha.200" }}
    >
      <Text fontSize="sm">{label}</Text>
      <select
        value={excluded ? "excluded" : "unlimited"}
        onChange={onToggle}
        aria-label={`Mode for ${label}`}
        data-resource-id={id}
        style={{
          fontSize: 12,
          padding: "4px 8px",
          borderRadius: 4,
          border: "1px solid rgba(255,255,255,0.15)",
          background: "rgba(255,255,255,0.06)",
          color: "white",
          cursor: "pointer",
          outline: "none"
        }}
      >
        <option value="unlimited" style={{ background: "#1a202c" }}>
          Unlimited
        </option>
        <option value="excluded" style={{ background: "#1a202c" }}>
          Excluded
        </option>
      </select>
    </HStack>
  );
}

export default ResourcesPanel;
