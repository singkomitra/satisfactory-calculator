"use client";
import { useContext, useEffect } from "react";
import { context } from "../state";
import { assertRecipeMap } from "../types";

export default function Init() {
  const { actions } = useContext(context);
  useEffect(() => {
    fetch("/api/data", { method: "GET" })
      .then(async (res) => await res.json())
      .then((data) => {
        assertRecipeMap(data);
        actions.setData(data);
      })
      .catch((err) => console.error(err));
  }, [actions]);
  return null;
}
