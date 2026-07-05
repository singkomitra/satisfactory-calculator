"use client";

import { Box, HStack, VStack, Text, Heading, Input } from "@chakra-ui/react";
import { observer } from "mobx-react-lite";
import { useContext } from "react";
import { context } from "@/state";
import { ResourceConstraint } from "@/calculator/lp-calculate";

type RawOption = { id: string; label: string };

type Props = {
  isOpen: boolean;
  onClose: () => void;
  rawResourceOptions: RawOption[];
};

const ResourcesPanel = observer(function ResourcesPanel({ isOpen, onClose, rawResourceOptions }: Props) {
  const { state, actions } = useContext(context);
  if (!isOpen) return null;

  const isLP = state.engine === "lp";

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
        width={{ base: "100%", md: "440px" }}
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
            {isLP
              ? "Set a mode per raw resource. Max/Min/Exact use the LP solver to enforce hard constraints on total consumption."
              : "Set a mode per raw resource. Excluded resources are treated as unavailable — recipes that transitively consume them are filtered out."}
          </Text>

          <VStack align="stretch" gap={2}>
            {rawResourceOptions.map((r) => (
              <ResourceRow
                key={r.id}
                id={r.id}
                label={r.label}
                isLP={isLP}
                constraint={
                  state.resourceConstraints[r.id] ??
                  (state.excludedResources[r.id] ? { mode: "excluded" } : { mode: "unlimited" })
                }
                onChange={(c) => actions.setResourceConstraint(r.id, c)}
                onSimpleToggle={() => actions.toggleExcludedResource(r.id)}
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
            onClick={isLP ? actions.clearResourceConstraints : actions.clearExcludedResources}
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
  isLP,
  constraint,
  onChange,
  onSimpleToggle
}: {
  id: string;
  label: string;
  isLP: boolean;
  constraint: ResourceConstraint;
  onChange: (c: ResourceConstraint) => void;
  onSimpleToggle: () => void;
}) {
  const highlighted = constraint.mode !== "unlimited";
  const showValue = isLP && (constraint.mode === "max" || constraint.mode === "min" || constraint.mode === "exact");

  return (
    <HStack
      justify="space-between"
      gap={2}
      p={2}
      borderRadius="md"
      borderWidth="1px"
      borderColor={highlighted ? "primary" : "whiteAlpha.100"}
      bg={highlighted ? "rgba(241,144,102,0.08)" : "transparent"}
      _hover={{ borderColor: highlighted ? "primary" : "whiteAlpha.200" }}
    >
      <Text fontSize="sm" flex="1" minWidth="0">
        {label}
      </Text>
      <select
        value={constraint.mode}
        onChange={(e) => {
          const v = e.target.value as ResourceConstraint["mode"];
          if (!isLP) {
            // Greedy engine only supports unlimited/excluded via simple toggle.
            onSimpleToggle();
            return;
          }
          if (v === "unlimited") onChange({ mode: "unlimited" });
          else if (v === "excluded") onChange({ mode: "excluded" });
          else if (v === "max" || v === "min" || v === "exact") {
            const prevVal =
              constraint.mode === "max" || constraint.mode === "min" || constraint.mode === "exact"
                ? constraint.value
                : 60;
            onChange({ mode: v, value: prevVal });
          }
        }}
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
        {isLP && (
          <>
            <option value="max" style={{ background: "#1a202c" }}>
              Max ≤
            </option>
            <option value="min" style={{ background: "#1a202c" }}>
              Min ≥
            </option>
            <option value="exact" style={{ background: "#1a202c" }}>
              Exact =
            </option>
          </>
        )}
      </select>
      {showValue && (
        <Input
          type="number"
          min={0}
          step="1"
          value={
            constraint.mode === "max" || constraint.mode === "min" || constraint.mode === "exact"
              ? constraint.value
              : 0
          }
          onChange={(e) => {
            const v = Number(e.target.value);
            if (constraint.mode === "max" || constraint.mode === "min" || constraint.mode === "exact") {
              onChange({ mode: constraint.mode, value: Number.isFinite(v) ? v : 0 });
            }
          }}
          width="90px"
          size="sm"
          bg="whiteAlpha.100"
          border="1px solid"
          borderColor="whiteAlpha.200"
          color="white"
          px={2}
          _hover={{ borderColor: "whiteAlpha.300" }}
          _focus={{ borderColor: "primary" }}
        />
      )}
    </HStack>
  );
}

export default ResourcesPanel;
