"use client";

import { useState, useEffect } from "react";
import styles from "./page.module.css";

export default function Home() {
  const [data, setData] = useState(null);
  useEffect(() => {
    fetch("/api/data", { method: "GET" })
      .then(async (res) => await res.json())
      .then(setData)
      .catch((err) => console.error(err));
  }, []);
  console.log(data);
  return (
    <main className={styles.main}>
      <span>{data ? JSON.stringify(data, null, 2) : null}</span>
    </main>
  );
}
