import { RecipeJsonObject } from "../types";

export type State = {
  data: RecipeJsonObject | null;
};

export const state: State = {
  data: null
};
