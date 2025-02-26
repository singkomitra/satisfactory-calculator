import { Recipe } from "@/types";
import { state } from "./state";

export const setData = (data: Recipe) => {
  state.data = data;
};
export const toggleTheme = () => {
  state.theme = state.theme === "light" ? "dark" : "light";
};
