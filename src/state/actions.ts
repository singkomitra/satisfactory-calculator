import { RecipeMap } from "@/types";
import { state } from "./state";

export const setData = (data: RecipeMap) => {
  state.data = data;
};
export const toggleTheme = () => {
  state.theme = state.theme === "light" ? "dark" : "light";
};
