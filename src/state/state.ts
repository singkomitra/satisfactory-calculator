import { Recipe } from "../types";
import { observable } from "mobx";

export type State = {
  data: Recipe | null;
};

export const state: State = observable({
  data: null
});
