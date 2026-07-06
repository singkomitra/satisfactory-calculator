"use client";
import { useContext, useEffect } from "react";
import { context } from "../state";
import { assertProductsMap } from "../types";

// Served from public/data — a plain static file on every host (GitHub Pages,
// the Docker image, `next dev`). NEXT_PUBLIC_BASE_PATH is inlined at build
// time; empty in dev and in the server build, /satisfactory-calculator on Pages.
const DATA_URL = `${process.env.NEXT_PUBLIC_BASE_PATH ?? ""}/data/products-map.json`;

export default function Init() {
  const { actions } = useContext(context);
  useEffect(() => {
    fetch(DATA_URL)
      .then(async (res) => await res.json())
      .then((data) => {
        assertProductsMap(data);
        actions.setData(data);
      })
      .catch((err) => console.error(err));
  }, [actions]);
  return null;
}
