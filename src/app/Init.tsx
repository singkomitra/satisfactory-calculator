import { useEffect, useState } from "react";

export default function Init() {

  useEffect(() => {
    fetch("/api/data", { method: "GET" })
      .then(async (res) => await res.json())
      .then(setData)
      .catch((err) => console.error(err));
  }, []);
  return null;
}
