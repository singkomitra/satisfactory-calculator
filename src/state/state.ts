import { RecipeMap } from "../types";
import { observable } from "mobx";

export type State = {
  data: RecipeMap | null;
  theme: "light" | "dark";
};

export const state: State = observable({
  data: null,
  theme: "light"
});
