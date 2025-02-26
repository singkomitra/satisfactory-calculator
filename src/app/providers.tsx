// app/providers.tsx
"use client";

import { context } from "@/state";
import { ChakraProvider, Theme, createSystem, defaultConfig, defineConfig } from "@chakra-ui/react";
import { observer } from "mobx-react-lite";
import { useContext } from "react";

const config = defineConfig({
  theme: {
    tokens: {
      colors: {
        navbar: {
          default: { value: "#574b90" }
        },
        primary: {
          default: { value: "#f19066" }
        },
        background: {
          default: { value: "#f0f0f0" },
          _dark: { value: "#1a202c" }
        }
      }
    },
    semanticTokens: {}
  }
});

const system = createSystem(defaultConfig, config);

export const Providers = observer(function Providers({ children }: { children: React.ReactNode }) {
  const { state } = useContext(context);
  return (
    <ChakraProvider value={system}>
      <Theme appearance={state.theme}>{children}</Theme>
    </ChakraProvider>
  );
});
