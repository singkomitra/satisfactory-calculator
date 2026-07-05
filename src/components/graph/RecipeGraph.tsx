"use client";

import { useEffect, useMemo } from "react";
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  Node,
  Edge,
  ReactFlowProvider,
  MarkerType,
  useNodesState,
  useEdgesState
} from "@xyflow/react";
import dagre from "@dagrejs/dagre";
import "@xyflow/react/dist/style.css";
import { Graph } from "@/calculator/graph";
import { PRODUCT_NODE_TYPE, ProductNode, ProductNodeData } from "./ProductNode";

const NODE_WIDTH = 220;
const NODE_HEIGHT = 130;

function layout(graph: Graph): { nodes: Node<ProductNodeData>[]; edges: Edge[] } {
  const g = new dagre.graphlib.Graph();
  g.setDefaultEdgeLabel(() => ({}));
  // LR = left→right. Raw materials on the left, final product on the right.
  g.setGraph({ rankdir: "LR", ranksep: 80, nodesep: 20, marginx: 20, marginy: 20 });

  for (const n of graph.nodes) {
    g.setNode(n.id, { width: NODE_WIDTH, height: NODE_HEIGHT });
  }
  for (const e of graph.edges) {
    // e.from = producer, e.to = consumer. Layout goes producer → consumer.
    g.setEdge(e.from, e.to);
  }
  dagre.layout(g);

  const nodes: Node<ProductNodeData>[] = graph.nodes.map((n) => {
    const pos = g.node(n.id);
    return {
      id: n.id,
      type: PRODUCT_NODE_TYPE,
      position: { x: pos.x - NODE_WIDTH / 2, y: pos.y - NODE_HEIGHT / 2 },
      data: {
        product: n.product,
        displayName: n.displayName,
        ppm: n.ppm,
        isRawResource: n.isRawResource,
        recipeName: n.recipeName,
        recipeDisplayName: n.recipeDisplayName,
        producedIn: n.producedIn,
        machineCount: n.machineCount,
        isRoot: n.id === graph.rootId
      },
      draggable: true
    };
  });

  const edges: Edge[] = graph.edges.map((e) => ({
    id: e.id,
    source: e.from,
    target: e.to,
    label: `${round(e.ppm)}/min ${e.displayName}`,
    labelStyle: { fontSize: 11, fontWeight: 500, fill: "#e2e8f0" },
    labelBgStyle: { fill: "#1a202c", fillOpacity: 0.85 },
    labelBgPadding: [6, 4] as [number, number],
    labelBgBorderRadius: 4,
    style: { stroke: "#f19066", strokeWidth: 2 },
    markerEnd: { type: MarkerType.ArrowClosed, color: "#f19066" },
    animated: false
  }));

  return { nodes, edges };
}

const round = (n: number) => {
  if (n === 0) return "0";
  if (Math.abs(n) < 0.01) return n.toExponential(1);
  return (Math.round(n * 100) / 100).toString();
};

const nodeTypes = { [PRODUCT_NODE_TYPE]: ProductNode };

function RecipeGraphInner({ graph }: { graph: Graph }) {
  const laidOut = useMemo(() => layout(graph), [graph]);
  const [nodes, setNodes, onNodesChange] = useNodesState<Node<ProductNodeData>>(laidOut.nodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>(laidOut.edges);

  // When the underlying graph changes (recipe swap, new product), re-run layout
  // and reset the react-flow state so positions come from dagre again.
  useEffect(() => {
    setNodes(laidOut.nodes);
    setEdges(laidOut.edges);
  }, [laidOut, setNodes, setEdges]);

  return (
    <ReactFlow
      nodes={nodes}
      edges={edges}
      onNodesChange={onNodesChange}
      onEdgesChange={onEdgesChange}
      nodeTypes={nodeTypes}
      fitView
      fitViewOptions={{ padding: 0.15, maxZoom: 1 }}
      defaultEdgeOptions={{ zIndex: 0 }}
      minZoom={0.2}
      maxZoom={2}
      proOptions={{ hideAttribution: true }}
    >
      <Background gap={24} size={1} color="#2d3748" />
      <MiniMap
        nodeColor={(node) => {
          const d = node.data as ProductNodeData;
          if (d.isRoot) return "#f19066";
          if (d.isRawResource) return "#f6ad55";
          return "#4a5568";
        }}
        maskColor="rgba(15, 20, 35, 0.7)"
        pannable
        zoomable
        style={{ background: "#1a202c", border: "1px solid #2d3748" }}
      />
      <Controls />
    </ReactFlow>
  );
}

export function RecipeGraph({ graph }: { graph: Graph }) {
  return (
    <ReactFlowProvider>
      <RecipeGraphInner graph={graph} />
    </ReactFlowProvider>
  );
}
