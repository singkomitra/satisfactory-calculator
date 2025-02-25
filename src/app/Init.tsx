import { useEffect, useState } from "react";

export default function Init() {
  const [data, setData] = useState(null);
  useEffect(() => {
    fetch("/api/data", { method: "GET" })
      .then(async (res) => await res.json())
      .then(setData)
      .catch((err) => console.error(err));
  }, []);
  return null;
}
