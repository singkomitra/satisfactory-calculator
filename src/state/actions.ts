import { Recipe } from "@/types";
import { state } from "./state";

export const setData = (data: Recipe) => {
  state.data = data;
};
