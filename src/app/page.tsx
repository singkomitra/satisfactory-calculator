"use client";

import { useEffect, useState } from "react";
import styles from "./page.module.css";

export default function Home() {
  const [data, setData] = useState(null);
  useEffect(() => {
    fetch("/api/data", { method: "GET" })
      .then((res) => res.json())
      .then(setData)
      .catch((err) => console.error(err));
  }, []);
  return (
    <main className={styles.main}>
      <span>{data ? JSON.stringify(JSON.parse(data), null, 2) : null}</span>
    </main>
  );
}
