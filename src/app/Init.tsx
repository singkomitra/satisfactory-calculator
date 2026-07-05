"use client";
import { useContext, useEffect } from "react";
import { context } from "../state";
import { assertProductsMap } from "../types";

export default function Init() {
  const { actions } = useContext(context);
  useEffect(() => {
    fetch("/api/data", { method: "GET" })
      .then(async (res) => await res.json())
      .then((data) => {
        assertProductsMap(data);
        actions.setData(data);
      })
      .catch((err) => console.error(err));
  }, [actions]);
  return null;
}
