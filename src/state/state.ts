import { Recipe } from "../types";
import { observable } from "mobx";

export type State = {
  data: Recipe | null;
  theme: "light" | "dark";
};

export const state: State = observable({
  data: null,
  theme: "light"
});
