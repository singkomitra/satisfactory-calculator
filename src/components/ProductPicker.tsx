"use client";

import { Box, Input, VStack, HStack, Text } from "@chakra-ui/react";
import { useContext, useMemo, useState } from "react";
import { observer } from "mobx-react-lite";
import { context } from "@/state";

const ProductPicker = observer(function ProductPicker() {
  const { state, actions } = useContext(context);
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);

  const options = useMemo(() => {
    if (!state.data) return [];
    const entries = Object.entries(state.data).map(([key, value]) => ({
      key,
      name: value.displayName
    }));
    const q = query.trim().toLowerCase();
    const filtered = q ? entries.filter((e) => e.name.toLowerCase().includes(q)) : entries;
    return filtered.slice(0, 40);
  }, [state.data, query]);

  const selected = state.selectedProduct && state.data ? state.data[state.selectedProduct] : null;

  return (
    <Box position="relative" width="100%">
      <Input
        placeholder="Search a product (e.g. Modular Frame)"
        value={open ? query : selected?.displayName ?? query}
        onFocus={() => setOpen(true)}
        onChange={(e) => {
          setQuery(e.target.value);
          setOpen(true);
        }}
        px={3}
      />
      {open && (
        <Box
          position="absolute"
          top="100%"
          left={0}
          right={0}
          zIndex={10}
          bg="bg.panel"
          borderWidth="1px"
          borderRadius="md"
          maxHeight="320px"
          overflowY="auto"
          mt={1}>
          {options.length === 0 ? (
            <Text p={3} color="fg.muted">
              {state.data ? "No matches" : "Loading products…"}
            </Text>
          ) : (
            <VStack align="stretch" gap={0}>
              {options.map((opt) => (
                <HStack
                  key={opt.key}
                  px={3}
                  py={2}
                  cursor="pointer"
                  _hover={{ bg: "bg.subtle" }}
                  onClick={() => {
                    actions.selectProduct(opt.key);
                    setQuery("");
                    setOpen(false);
                  }}>
                  <Text>{opt.name}</Text>
                </HStack>
              ))}
            </VStack>
          )}
        </Box>
      )}
    </Box>
  );
});

export default ProductPicker;
