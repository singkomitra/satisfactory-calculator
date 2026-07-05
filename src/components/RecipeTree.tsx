"use client";

import { Box, HStack, Text, VStack, Badge } from "@chakra-ui/react";
import { CalculationNode } from "@/calculator/calculate";

type Props = {
  node: CalculationNode;
  depth?: number;
};

const round = (n: number) => Math.round(n * 100) / 100;

const buildingLabel = (raw: string) =>
  raw
    .replace(/^Build_/, "")
    .replace(/_C$/, "")
    .replace(/Mk\d+$/, (m) => ` ${m}`);

export function RecipeTree({ node, depth = 0 }: Props) {
  const indent = depth * 20;
  return (
    <Box pl={`${indent}px`} borderLeft={depth > 0 ? "2px solid" : undefined} borderColor="gray.300" mb={2}>
      <HStack gap={3} py={1}>
        <Text fontWeight="semibold">{node.displayName}</Text>
        <Badge colorPalette={node.isRawResource ? "orange" : "blue"}>{round(node.ppm)}/min</Badge>
        {node.recipe && (
          <>
            <Text fontSize="sm" color="fg.muted">
              via {node.recipe.displayName}
            </Text>
            <Badge colorPalette="green">
              {round(node.recipe.machineCount)}× {buildingLabel(node.recipe.producedIn)}
            </Badge>
          </>
        )}
        {node.isRawResource && <Badge colorPalette="orange">raw</Badge>}
      </HStack>
      {node.ingredients.length > 0 && (
        <VStack align="stretch" gap={0} pl={4}>
          {node.ingredients.map((child, i) => (
            <RecipeTree key={`${child.product}-${i}`} node={child} depth={depth + 1} />
          ))}
        </VStack>
      )}
    </Box>
  );
}
