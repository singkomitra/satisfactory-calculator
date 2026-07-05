// Minimal type shim for javascript-lp-solver (v1.0.3).
declare module "javascript-lp-solver" {
  export type Model = {
    optimize: string;
    opType: "min" | "max";
    // Row constraints. Each row can have min, max, or equal (or a combination).
    constraints: Record<string, { min?: number; max?: number; equal?: number }>;
    // Variables: variable-name -> { row-name -> coefficient, ... }.
    // The `optimize` row is treated as the objective row.
    variables: Record<string, Record<string, number>>;
    ints?: Record<string, number>;
  };

  export type SolveResult = {
    feasible: boolean;
    result: number;
    bounded: boolean;
    // Additional keys: variable-name -> value (only for variables > 0).
    [key: string]: number | boolean;
  };

  const solver: {
    Solve(model: Model): SolveResult;
  };

  export default solver;
}
