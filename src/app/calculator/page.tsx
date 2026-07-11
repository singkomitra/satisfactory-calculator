"use client";

import { useContext, useMemo, useState } from "react";
import { context } from "@/state";
import { observer } from "mobx-react-lite";
import { Box, HStack, VStack, Input, Text, Heading } from "@chakra-ui/react";
import ProductPicker from "@/components/ProductPicker";
import { RecipeGraph } from "@/components/graph/RecipeGraph";
import { calculate, CalculationResult, Strategy } from "@/calculator/calculate";
import { calculateLP, LPObjective } from "@/calculator/lp-calculate";
import { buildGraph } from "@/calculator/graph";
import { listRawResources } from "@/calculator/rawResources";
import ResourcesPanel from "@/components/ResourcesPanel";
import { CalculationEngine, OptimizationGoal } from "@/state/state";

const NAV_HEIGHT = "76px";

const round = (n: number) => {
  if (n === 0) return "0";
  if (Math.abs(n) < 0.01) return n.toExponential(1);
  return (Math.round(n * 100) / 100).toString();
};
const buildingLabel = (raw: string) => raw.replace(/^Build_/, "").replace(/_C$/, "");
const rawLabel = (raw: string) => raw.replace(/^Desc_/, "").replace(/_C$/, "");

const selectStyle: React.CSSProperties = {
  width: "100%",
  background: "rgba(255,255,255,0.06)",
  border: "1px solid rgba(255,255,255,0.15)",
  color: "white",
  padding: "8px 12px",
  borderRadius: "6px",
  fontSize: "14px",
  cursor: "pointer",
  outline: "none"
};

function objectiveToKey(obj: LPObjective): string {
  if (obj.kind === "min-resource") return `min-resource:${obj.resource}`;
  return obj.kind;
}

function keyToObjective(key: string, fallback: LPObjective): LPObjective {
  if (key.startsWith("min-resource:")) return { kind: "min-resource", resource: key.slice("min-resource:".length) };
  if (key === "min-buildings" || key === "min-all-raw" || key === "min-byproducts") return { kind: key };
  return fallback;
}

export default observer(function CalculatorPage() {
  const { state, actions } = useContext(context);
  const [resourcesOpen, setResourcesOpen] = useState(false);

  const excludedList = useMemo(() => Object.keys(state.excludedResources), [state.excludedResources]);

  const result: CalculationResult | null = useMemo(() => {
    if (!state.data || !state.selectedProduct) return null;
    if (!Number.isFinite(state.targetPpm) || state.targetPpm <= 0) return null;
    if (state.engine === "lp") {
      return calculateLP(state.data, state.selectedProduct, state.targetPpm, {
        recipeOverrides: state.recipeOverrides,
        resourceConstraints: state.resourceConstraints,
        rejectByproductRecipes: state.rejectByproductRecipes,
        allowByproductSurplus: !state.closedByproducts,
        objective: state.lpObjective
      });
    }
    return calculate(state.data, state.selectedProduct, state.targetPpm, {
      strategy: state.strategy,
      recipeOverrides: state.recipeOverrides,
      targetResource: state.targetResource,
      excludedResources: excludedList,
      rejectByproductRecipes: state.rejectByproductRecipes
    });
  }, [
    state.data,
    state.selectedProduct,
    state.targetPpm,
    state.engine,
    state.strategy,
    state.targetResource,
    state.recipeOverrides,
    state.rejectByproductRecipes,
    state.resourceConstraints,
    state.closedByproducts,
    state.lpObjective,
    excludedList
  ]);

  const rawResourceOptions = useMemo(() => (state.data ? listRawResources(state.data) : []), [state.data]);
  const graph = useMemo(() => (result && !result.infeasible ? buildGraph(result) : null), [result]);
  const hasOverrides = Object.keys(state.recipeOverrides).length > 0;

  return (
    <Box display="flex" flexDirection="column" height={`calc(100vh - ${NAV_HEIGHT})`} bg="#0f1420">
      <Toolbar
        state={state}
        actions={actions}
        hasOverrides={hasOverrides}
        onClearOverrides={actions.clearAllOverrides}
        rawResourceOptions={rawResourceOptions}
        onOpenResources={() => setResourcesOpen(true)}
        excludedCount={excludedList.length}
      />

      <Box position="relative" flex="1" overflow="hidden">
        {!state.data && <CanvasMessage title="Loading catalog…" />}
        {state.data && !state.selectedProduct && (
          <CanvasMessage
            title="Pick a product to start"
            hint="Try Modular Frame at 60/min, or Heavy Modular Frame at 5/min."
          />
        )}
        {result?.infeasible && (
          <InfeasibleMessage
            product={result.infeasible.product}
            reason={result.infeasible.reason}
            excludedList={excludedList}
            rawResourceOptions={rawResourceOptions}
            rejectByproducts={state.rejectByproductRecipes}
          />
        )}
        {graph && <RecipeGraph graph={graph} />}
        {result && !result.infeasible && <SummaryPanel result={result} />}
      </Box>

      <ResourcesPanel
        isOpen={resourcesOpen}
        onClose={() => setResourcesOpen(false)}
        rawResourceOptions={rawResourceOptions}
      />
    </Box>
  );
});

function InfeasibleMessage({
  product,
  reason,
  excludedList,
  rawResourceOptions,
  rejectByproducts
}: {
  product: string;
  reason: string;
  excludedList: string[];
  rawResourceOptions: RawOption[];
  rejectByproducts: boolean;
}) {
  const labels = rawResourceOptions.reduce<Record<string, string>>((acc, r) => {
    acc[r.id] = r.label;
    return acc;
  }, {});
  const excludedNames = excludedList.map((id) => labels[id] ?? id).join(", ");
  return (
    <Box position="absolute" inset={0} display="flex" alignItems="center" justifyContent="center" p={8}>
      <VStack gap={3} maxWidth="520px" textAlign="center">
        <Heading size="md" color="orange.300">
          No feasible plan
        </Heading>
        <Text color="whiteAlpha.800">
          Cannot produce <b>{rawLabel(product)}</b>{" "}
          {reason === "no-recipe-avoids-excluded" && excludedList.length > 0 && <>without consuming {excludedNames}.</>}
          {reason === "no-recipe-avoids-byproducts" && rejectByproducts && <>using only recipes with no byproducts.</>}
          {reason === "no-recipe" && <>— no recipe exists that satisfies the current filters.</>}
        </Text>
        <Text color="whiteAlpha.500" fontSize="sm">
          Open the Resources panel to relax the filters.
        </Text>
      </VStack>
    </Box>
  );
}

type CalcState = {
  targetPpm: number;
  goal: OptimizationGoal;
  goalResource: string | null;
  advancedMode: boolean;
  engine: CalculationEngine;
  strategy: Strategy;
  targetResource: string | null;
  rejectByproductRecipes: boolean;
  closedByproducts: boolean;
  lpObjective: LPObjective;
};
type CalcActions = {
  setTargetPpm: (n: number) => void;
  setGoal: (g: OptimizationGoal, resource?: string | null) => void;
  setAdvancedMode: (v: boolean) => void;
  setEngine: (e: CalculationEngine) => void;
  setStrategy: (s: Strategy) => void;
  setTargetResource: (r: string | null) => void;
  setRejectByproductRecipes: (v: boolean) => void;
  setClosedByproducts: (v: boolean) => void;
  setLPObjective: (o: LPObjective) => void;
};
type RawOption = { id: string; label: string };

const GOAL_LABELS: Record<OptimizationGoal, string> = {
  standard: "Standard recipes",
  "fewest-machines": "Fewest machines",
  "least-raw": "Least raw resources",
  "save-resource": "Save a specific resource…",
  "no-waste": "No waste (recycle byproducts)",
  custom: "Custom (advanced)"
};

const Toolbar = observer(function Toolbar({
  state,
  actions,
  hasOverrides,
  onClearOverrides,
  rawResourceOptions,
  onOpenResources,
  excludedCount
}: {
  state: CalcState;
  actions: CalcActions;
  hasOverrides: boolean;
  onClearOverrides: () => void;
  rawResourceOptions: RawOption[];
  onOpenResources: () => void;
  excludedCount: number;
}) {
  return (
    <Box
      bg="#0f1420"
      borderBottom="1px solid"
      borderColor="whiteAlpha.100"
      px={{ base: 6, md: 8 }}
      py={4}
      color="white"
      flexShrink={0}>
      <HStack gap={4} align="end" flexWrap="wrap">
        <Box flex="2" minWidth="240px">
          <Text
            mb={1}
            fontSize="xs"
            color="whiteAlpha.700"
            fontWeight="600"
            letterSpacing="wider"
            textTransform="uppercase">
            Product
          </Text>
          <ProductPicker />
        </Box>
        <Box flex="1" minWidth="130px" maxWidth="180px">
          <Text
            mb={1}
            fontSize="xs"
            color="whiteAlpha.700"
            fontWeight="600"
            letterSpacing="wider"
            textTransform="uppercase">
            Rate (/min)
          </Text>
          <Input
            type="number"
            min={0}
            step="1"
            value={state.targetPpm}
            onChange={(e) => actions.setTargetPpm(Number(e.target.value))}
            bg="whiteAlpha.100"
            border="1px solid"
            borderColor="whiteAlpha.200"
            color="white"
            px={3}
            _hover={{ borderColor: "whiteAlpha.300" }}
            _focus={{ borderColor: "primary" }}
          />
        </Box>
        <Box flex="1.4" minWidth="230px">
          <Text
            mb={1}
            fontSize="xs"
            color="whiteAlpha.700"
            fontWeight="600"
            letterSpacing="wider"
            textTransform="uppercase">
            Optimize for
          </Text>
          <select
            value={state.goal}
            onChange={(e) => actions.setGoal(e.target.value as OptimizationGoal)}
            style={selectStyle}
            aria-label="Optimize for">
            {(Object.keys(GOAL_LABELS) as OptimizationGoal[])
              .filter((g) => g !== "custom" || state.goal === "custom")
              .map((g) => (
                <option key={g} value={g} disabled={g === "custom"} style={{ background: "#1a202c" }}>
                  {GOAL_LABELS[g]}
                </option>
              ))}
          </select>
        </Box>
        {state.goal === "save-resource" && (
          <Box flex="1" minWidth="180px">
            <Text
              mb={1}
              fontSize="xs"
              color="whiteAlpha.700"
              fontWeight="600"
              letterSpacing="wider"
              textTransform="uppercase">
              Resource to save
            </Text>
            <select
              value={state.goalResource ?? ""}
              onChange={(e) => actions.setGoal("save-resource", e.target.value || null)}
              style={selectStyle}
              aria-label="Resource to save">
              <option value="" disabled style={{ background: "#1a202c" }}>
                Pick a resource…
              </option>
              {rawResourceOptions.map((r) => (
                <option key={r.id} value={r.id} style={{ background: "#1a202c" }}>
                  {r.label}
                </option>
              ))}
            </select>
          </Box>
        )}
        <Box>
          <Text
            mb={1}
            fontSize="xs"
            color="whiteAlpha.700"
            fontWeight="600"
            letterSpacing="wider"
            textTransform="uppercase">
            Resources
          </Text>
          <Box
            as="button"
            onClick={onOpenResources}
            px={3}
            py={2}
            borderWidth="1px"
            borderColor={excludedCount > 0 ? "primary" : "whiteAlpha.300"}
            bg={excludedCount > 0 ? "rgba(241,144,102,0.12)" : "transparent"}
            borderRadius="md"
            fontSize="sm"
            fontWeight="600"
            color="white"
            cursor="pointer"
            _hover={{ borderColor: "primary" }}>
            {excludedCount > 0 ? `${excludedCount} excluded` : "Manage…"}
          </Box>
        </Box>
        {hasOverrides && (
          <Box>
            <Text
              mb={1}
              fontSize="xs"
              color="whiteAlpha.700"
              fontWeight="600"
              letterSpacing="wider"
              textTransform="uppercase">
              Overrides
            </Text>
            <Box
              as="button"
              onClick={onClearOverrides}
              fontSize="sm"
              color="primary"
              cursor="pointer"
              _hover={{ textDecoration: "underline" }}>
              Reset all
            </Box>
          </Box>
        )}
        <Box marginLeft="auto" alignSelf="end">
          <Box
            as="button"
            onClick={() => actions.setAdvancedMode(!state.advancedMode)}
            fontSize="xs"
            color={state.advancedMode ? "primary" : "whiteAlpha.500"}
            cursor="pointer"
            py={2}
            _hover={{ color: "primary" }}>
            {state.advancedMode ? "▴ Hide advanced" : "▾ Advanced"}
          </Box>
        </Box>
      </HStack>

      {state.advancedMode && (
        <HStack gap={4} align="end" flexWrap="wrap" mt={4} pt={4} borderTop="1px solid" borderColor="whiteAlpha.100">
          <Box>
            <Text
              mb={1}
              fontSize="xs"
              color="whiteAlpha.700"
              fontWeight="600"
              letterSpacing="wider"
              textTransform="uppercase">
              Engine
            </Text>
            <HStack gap={1}>
              <StrategyPill<CalculationEngine>
                current={state.engine}
                value="greedy"
                label="Greedy"
                onSelect={actions.setEngine}
              />
              <StrategyPill<CalculationEngine>
                current={state.engine}
                value="lp"
                label="LP"
                onSelect={actions.setEngine}
              />
            </HStack>
          </Box>
          {state.engine === "greedy" && (
            <>
              <Box>
                <Text
                  mb={1}
                  fontSize="xs"
                  color="whiteAlpha.700"
                  fontWeight="600"
                  letterSpacing="wider"
                  textTransform="uppercase">
                  Strategy
                </Text>
                <HStack gap={1}>
                  <StrategyPill<Strategy>
                    current={state.strategy}
                    value="main"
                    label="Main"
                    onSelect={actions.setStrategy}
                  />
                  <StrategyPill<Strategy>
                    current={state.strategy}
                    value="greedy-min-raw"
                    label="Min raw"
                    onSelect={actions.setStrategy}
                  />
                </HStack>
              </Box>
              {state.strategy === "greedy-min-raw" && (
                <Box flex="1" minWidth="200px">
                  <Text
                    mb={1}
                    fontSize="xs"
                    color="whiteAlpha.700"
                    fontWeight="600"
                    letterSpacing="wider"
                    textTransform="uppercase">
                    Minimize
                  </Text>
                  <select
                    value={state.targetResource ?? ""}
                    onChange={(e) => {
                      const v = e.target.value;
                      actions.setTargetResource(v === "" ? null : v);
                    }}
                    style={selectStyle}>
                    <option value="" style={{ background: "#1a202c" }}>
                      All raw (unweighted)
                    </option>
                    {rawResourceOptions.map((r) => (
                      <option key={r.id} value={r.id} style={{ background: "#1a202c" }}>
                        {r.label}
                      </option>
                    ))}
                  </select>
                </Box>
              )}
            </>
          )}
          {state.engine === "lp" && (
            <Box flex="1" minWidth="220px">
              <Text
                mb={1}
                fontSize="xs"
                color="whiteAlpha.700"
                fontWeight="600"
                letterSpacing="wider"
                textTransform="uppercase">
                Objective
              </Text>
              <select
                value={objectiveToKey(state.lpObjective)}
                onChange={(e) => actions.setLPObjective(keyToObjective(e.target.value, state.lpObjective))}
                style={selectStyle}>
                <option value="min-buildings" style={{ background: "#1a202c" }}>
                  Min buildings
                </option>
                <option value="min-byproducts" style={{ background: "#1a202c" }}>
                  Min byproducts
                </option>
                <option value="min-all-raw" style={{ background: "#1a202c" }}>
                  Min all raw (unweighted)
                </option>
                {rawResourceOptions.map((r) => (
                  <option key={r.id} value={`min-resource:${r.id}`} style={{ background: "#1a202c" }}>
                    Min {r.label}
                  </option>
                ))}
              </select>
            </Box>
          )}
          <Box>
            <Text
              mb={1}
              fontSize="xs"
              color="whiteAlpha.700"
              fontWeight="600"
              letterSpacing="wider"
              textTransform="uppercase">
              Byproducts
            </Text>
            <HStack gap={1}>
              <ByproductPill
                active={!state.rejectByproductRecipes}
                label="Allow"
                onSelect={() => actions.setRejectByproductRecipes(false)}
              />
              <ByproductPill
                active={state.rejectByproductRecipes}
                label="Reject"
                onSelect={() => actions.setRejectByproductRecipes(true)}
              />
              {state.engine === "lp" && (
                <ByproductPill
                  active={state.closedByproducts}
                  label="Closed loop"
                  onSelect={() => actions.setClosedByproducts(!state.closedByproducts)}
                />
              )}
            </HStack>
          </Box>
        </HStack>
      )}
    </Box>
  );
});

function ByproductPill({ active, label, onSelect }: { active: boolean; label: string; onSelect: () => void }) {
  return (
    <Box
      as="button"
      onClick={onSelect}
      px={3}
      py={2}
      borderRadius="md"
      borderWidth="1px"
      borderColor={active ? "primary" : "whiteAlpha.300"}
      bg={active ? "primary" : "transparent"}
      color={active ? "white" : "whiteAlpha.700"}
      fontSize="sm"
      fontWeight="600"
      cursor="pointer"
      _hover={{ borderColor: "primary", color: "white" }}>
      {label}
    </Box>
  );
}

function StrategyPill<V extends string>({
  current,
  value,
  label,
  onSelect
}: {
  current: V;
  value: V;
  label: string;
  onSelect: (v: V) => void;
}) {
  const active = current === value;
  return (
    <Box
      as="button"
      onClick={() => onSelect(value)}
      px={3}
      py={2}
      borderRadius="md"
      borderWidth="1px"
      borderColor={active ? "primary" : "whiteAlpha.300"}
      bg={active ? "primary" : "transparent"}
      color={active ? "white" : "whiteAlpha.700"}
      fontSize="sm"
      fontWeight="600"
      cursor="pointer"
      _hover={{ borderColor: "primary", color: "white" }}>
      {label}
    </Box>
  );
}

function CanvasMessage({ title, hint }: { title: string; hint?: string }) {
  return (
    <Box position="absolute" inset={0} display="flex" alignItems="center" justifyContent="center" pointerEvents="none">
      <VStack gap={2}>
        <Heading size="md" color="whiteAlpha.700">
          {title}
        </Heading>
        {hint && (
          <Text color="whiteAlpha.500" fontSize="sm">
            {hint}
          </Text>
        )}
      </VStack>
    </Box>
  );
}

function SummaryPanel({ result }: { result: CalculationResult }) {
  const rawEntries = Object.entries(result.rawResources).sort((a, b) => b[1] - a[1]);
  const machineEntries = Object.entries(result.machines).sort((a, b) => b[1] - a[1]);
  const totalMachines = machineEntries.reduce((sum, [, n]) => sum + n, 0);

  return (
    <Box
      position="absolute"
      top={4}
      right={4}
      zIndex={20}
      bg="rgba(15, 20, 32, 0.9)"
      backdropFilter="blur(12px)"
      border="1px solid"
      borderColor="whiteAlpha.200"
      borderRadius="lg"
      color="white"
      minWidth="260px"
      maxWidth="320px"
      maxHeight="65vh"
      overflowY="auto">
      <VStack align="stretch" gap={0} p={3}>
        <SummarySection title="Raw resources" total={rawEntries.length ? `${rawEntries.length} items` : undefined}>
          {rawEntries.length === 0 ? (
            <Text fontSize="xs" color="whiteAlpha.500">
              No raw resources.
            </Text>
          ) : (
            rawEntries.map(([item, ppm]) => (
              <HStack key={item} justify="space-between" fontSize="xs">
                <Text color="whiteAlpha.900">{rawLabel(item)}</Text>
                <Text color="primary" fontFamily="mono" fontWeight="600">
                  {round(ppm)}/min
                </Text>
              </HStack>
            ))
          )}
        </SummarySection>

        <SummarySection title="Buildings" total={`${round(totalMachines)} total`}>
          {machineEntries.length === 0 ? (
            <Text fontSize="xs" color="whiteAlpha.500">
              No buildings needed.
            </Text>
          ) : (
            machineEntries.map(([building, count]) => (
              <HStack key={building} justify="space-between" fontSize="xs">
                <Text color="whiteAlpha.900">{buildingLabel(building)}</Text>
                <Text color="green.300" fontFamily="mono" fontWeight="600">
                  {round(count)}×
                </Text>
              </HStack>
            ))
          )}
        </SummarySection>

        {result.byproducts.length > 0 && (
          <SummarySection title="Byproducts" total={`${result.byproducts.length} items`}>
            {result.byproducts.map((bp) => (
              <VStack key={bp.item} align="stretch" gap={0} fontSize="xs">
                <HStack justify="space-between">
                  <Text color="whiteAlpha.900">{bp.displayName}</Text>
                  <Text color="yellow.300" fontFamily="mono" fontWeight="600">
                    {round(bp.produced)}/min
                  </Text>
                </HStack>
                <Text fontSize="10px" color="whiteAlpha.500">
                  {bp.unclaimed > 0 ? "● unclaimed — needs a sink" : "○ consumed downstream"}
                </Text>
              </VStack>
            ))}
          </SummarySection>
        )}
      </VStack>
    </Box>
  );
}

function SummarySection({ title, total, children }: { title: string; total?: string; children: React.ReactNode }) {
  return (
    <Box borderBottomWidth="1px" borderColor="whiteAlpha.100" pb={3} mb={3} _last={{ borderBottom: 0, pb: 0, mb: 0 }}>
      <HStack justify="space-between" mb={2}>
        <Text fontSize="xs" fontWeight="700" letterSpacing="wider" textTransform="uppercase" color="whiteAlpha.700">
          {title}
        </Text>
        {total && (
          <Text fontSize="xs" color="whiteAlpha.500">
            {total}
          </Text>
        )}
      </HStack>
      <VStack align="stretch" gap={1}>
        {children}
      </VStack>
    </Box>
  );
}
