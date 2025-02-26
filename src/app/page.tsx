"use client";

import { useState, useEffect, useContext } from "react";
import styles from "./page.module.css";
import { context } from "@/state";
import { observer } from "mobx-react-lite";

export default observer(function Home() {
  const { state } = useContext(context);
  return (
    <main className={styles.main}>
      <span>{state.data ? JSON.stringify(state.data, null, 2) : null}</span>
    </main>
  );
});
