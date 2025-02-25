import { RecipeJsonObject } from "@/types";
import { state } from "./state";

export const setData = (data: RecipeJsonObject) => {
  state.data = data;
};
