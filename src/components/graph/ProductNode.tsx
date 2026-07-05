"use client";

import { memo, useContext, useState } from "react";
import { Handle, Position, NodeProps } from "@xyflow/react";
import { context } from "@/state";
import { observer } from "mobx-react-lite";
import { ProductIcon } from "./ProductIcon";

const round = (n: number) => {
  if (n === 0) return "0";
  if (Math.abs(n) < 0.01) return n.toExponential(1);
  return (Math.round(n * 100) / 100).toString();
};

const buildingLabel = (raw: string | null) =>
  raw ? raw.replace(/^Build_/, "").replace(/_C$/, "").replace(/Mk\d+$/, (m) => ` ${m}`) : "";

export type ProductNodeData = Record<string, unknown> & {
  product: string;
  displayName: string;
  ppm: number;
  isRawResource: boolean;
  isByproduct?: boolean;
  recipeName: string | null;
  recipeDisplayName: string | null;
  producedIn: string | null;
  machineCount: number;
  isRoot?: boolean;
};

export const PRODUCT_NODE_TYPE = "product" as const;

const ProductNodeInner = observer(function ProductNodeInner({ data }: NodeProps) {
  const d = data as ProductNodeData;
  const { state, actions } = useContext(context);
  const [pickerOpen, setPickerOpen] = useState(false);

  const productEntry = state.data?.[d.product];
  const alternatives = productEntry
    ? [productEntry.mainRecipe, ...productEntry.altRecipes].filter(Boolean)
    : [];
  const overridden = !!state.recipeOverrides[d.product];

  return (
    <div
      className={`product-node ${d.isRawResource ? "is-raw" : ""} ${d.isByproduct ? "is-byproduct" : ""} ${d.isRoot ? "is-root" : ""}`}
    >
      {!d.isRawResource && !d.isByproduct && <Handle type="target" position={Position.Left} className="node-handle" />}
      {d.isByproduct && <Handle type="target" position={Position.Left} className="node-handle" />}

      <div className="product-node-header">
        <ProductIcon product={d.product} displayName={d.displayName} size={28} />
        <div className="product-node-title-block">
          <div className="product-node-title">{d.displayName}</div>
        </div>
        <div className="product-node-rate">
          <span className="rate-value">{round(d.ppm)}</span>
          <span className="rate-unit">/min</span>
        </div>
      </div>

      {d.isRawResource ? (
        <div className="product-node-body">
          <div className="raw-badge">Raw resource</div>
        </div>
      ) : d.isByproduct ? (
        <div className="product-node-body">
          <div className="raw-badge byproduct-badge">Byproduct · unclaimed</div>
        </div>
      ) : (
        <div className="product-node-body">
          <div className="product-node-machine">
            <span className="machine-count">{round(d.machineCount)}×</span>
            <span className="machine-name">{buildingLabel(d.producedIn)}</span>
          </div>
          {alternatives.length > 0 && (
            <div className="product-node-recipe">
              <button
                className={`recipe-button ${overridden ? "is-overridden" : ""}`}
                onClick={(e) => {
                  e.stopPropagation();
                  setPickerOpen((v) => !v);
                }}
                type="button"
              >
                <span className="recipe-label">Recipe</span>
                <span className="recipe-name">{d.recipeDisplayName}</span>
                <span className="recipe-caret">{pickerOpen ? "▲" : "▼"}</span>
              </button>
              {pickerOpen && (
                <div className="recipe-picker">
                  {alternatives.map((r) => {
                    const active = r.recipeName === d.recipeName;
                    return (
                      <button
                        key={r.recipeName}
                        className={`recipe-option ${active ? "is-active" : ""}`}
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          actions.setRecipeOverride(d.product, r.recipeName);
                          setPickerOpen(false);
                        }}
                      >
                        <span className="option-name">{r.displayName}</span>
                        <span className="option-meta">
                          {round(r.ppm)}/min · {buildingLabel(r.producedIn)}
                        </span>
                      </button>
                    );
                  })}
                  {overridden && (
                    <button
                      className="recipe-option is-reset"
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        actions.clearRecipeOverride(d.product);
                        setPickerOpen(false);
                      }}
                    >
                      Reset to default
                    </button>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {!d.isByproduct && <Handle type="source" position={Position.Right} className="node-handle" />}
    </div>
  );
});

export const ProductNode = memo(ProductNodeInner);
