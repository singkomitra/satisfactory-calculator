import { CalculationNode, CalculationResult } from "./calculate";

/**
 * Graph representation of a calculation.
 *
 * - Nodes are unique products (e.g. Iron Ingot, Modular Frame). If the same
 *   product appears in multiple places in the recipe tree, it collapses to a
 *   single node whose ppm is the sum of every demand and whose machine
 *   count is the sum across all uses.
 * - Edges carry item + ppm. An edge from node A to node B means "A produces
 *   `item` at `ppm`/min that is consumed by B".
 * - Machine info lives on the node (`producedIn`, `machineCount`). This
 *   models the "machine as processing relationship" the user asked for:
 *   the node *is* the machine + product pair, and edges are the material
 *   flows between them.
 */
export type GraphNode = {
  id: string;
  product: string;
  displayName: string;
  ppm: number;
  isRawResource: boolean;
  isByproduct: boolean;
  recipeName: string | null;
  recipeDisplayName: string | null;
  producedIn: string | null;
  machineCount: number;
};

export type GraphEdge = {
  id: string;
  from: string;
  to: string;
  item: string;
  displayName: string;
  ppm: number;
};

export type Graph = {
  nodes: GraphNode[];
  edges: GraphEdge[];
  rootId: string;
};

export function buildGraph(result: CalculationResult): Graph {
  const nodes = new Map<string, GraphNode>();
  const edges = new Map<string, GraphEdge>();

  const upsert = (node: CalculationNode): GraphNode => {
    const existing = nodes.get(node.product);
    if (existing) {
      existing.ppm += node.ppm;
      existing.machineCount += node.recipe?.machineCount ?? 0;
      return existing;
    }
    const created: GraphNode = {
      id: node.product,
      product: node.product,
      displayName: node.displayName,
      ppm: node.ppm,
      isRawResource: node.isRawResource,
      isByproduct: false,
      recipeName: node.recipe?.recipeName ?? null,
      recipeDisplayName: node.recipe?.displayName ?? null,
      producedIn: node.recipe?.producedIn ?? null,
      machineCount: node.recipe?.machineCount ?? 0
    };
    nodes.set(node.product, created);
    return created;
  };

  // Byproducts get their own aggregated sink nodes, keyed separately from
  // regular product nodes so a byproduct pool never merges with a normal
  // "this product is being consumed" node.
  const upsertByproduct = (item: string, displayName: string, ppm: number): GraphNode => {
    const id = `byproduct:${item}`;
    const existing = nodes.get(id);
    if (existing) {
      existing.ppm += ppm;
      return existing;
    }
    const created: GraphNode = {
      id,
      product: item,
      displayName,
      ppm,
      isRawResource: false,
      isByproduct: true,
      recipeName: null,
      recipeDisplayName: null,
      producedIn: null,
      machineCount: 0
    };
    nodes.set(id, created);
    return created;
  };

  const addEdge = (fromProduct: string, toProduct: string, itemNode: CalculationNode) => {
    const key = `${fromProduct}->${toProduct}:${itemNode.product}`;
    const existing = edges.get(key);
    if (existing) {
      existing.ppm += itemNode.ppm;
      return;
    }
    edges.set(key, {
      id: key,
      from: fromProduct,
      to: toProduct,
      item: itemNode.product,
      displayName: itemNode.displayName,
      ppm: itemNode.ppm
    });
  };

  const addByproductEdge = (fromProduct: string, bpItem: string, bpDisplayName: string, ppm: number) => {
    const toId = `byproduct:${bpItem}`;
    const key = `${fromProduct}->${toId}`;
    const existing = edges.get(key);
    if (existing) {
      existing.ppm += ppm;
      return;
    }
    edges.set(key, {
      id: key,
      from: fromProduct,
      to: toId,
      item: bpItem,
      displayName: bpDisplayName,
      ppm
    });
  };

  const walk = (node: CalculationNode) => {
    upsert(node);
    // Byproducts co-produced by this recipe become their own sink nodes.
    if (node.recipe) {
      for (const bp of node.recipe.byproducts) {
        upsertByproduct(bp.item, bp.displayName, bp.ppm);
        addByproductEdge(node.product, bp.item, bp.displayName, bp.ppm);
      }
    }
    for (const ing of node.ingredients) {
      // Flow direction: ingredient (producer) → parent product (consumer).
      addEdge(ing.product, node.product, ing);
      walk(ing);
    }
  };

  if (result.tree) walk(result.tree);

  return {
    nodes: Array.from(nodes.values()),
    edges: Array.from(edges.values()),
    rootId: result.tree?.product ?? ""
  };
}
