"use client";

import { useContext } from "react";
import styles from "./page.module.css";
import { context } from "@/state";
import { observer } from "mobx-react-lite";
import { Box, Button, Input } from "@chakra-ui/react";
import NavBar from "@/components/NavBar";

export default observer(function Home() {
  const { state, actions } = useContext(context);
  return (
    <Box className={styles.main} bg="background">
      <Button onClick={() => actions.toggleTheme()}></Button>
    </Box>
  );
});
