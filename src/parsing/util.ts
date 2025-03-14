import { join } from "path";

// ex: ((ItemClass=\"/Script/Engine.BlueprintGeneratedClass'/Game/FactoryGame/Resource/Parts/Computer/Desc_Computer.Desc_Computer_C'\",Amount=4),(ItemClass=\"/Script/Engine.BlueprintGeneratedClass'/Game/FactoryGame/Resource/Parts/CircuitBoardHighSpeed/Desc_CircuitBoardHighSpeed.Desc_CircuitBoardHighSpeed_C'\",Amount=2),(ItemClass=\"/Script/Engine.BlueprintGeneratedClass'/Game/FactoryGame/Resource/Parts/HighSpeedConnector/Desc_HighSpeedConnector.Desc_HighSpeedConnector_C'\",Amount=3),(ItemClass=\"/Script/Engine.BlueprintGeneratedClass'/Game/FactoryGame/Resource/Parts/Plastic/Desc_Plastic.Desc_Plastic_C'\",Amount=28))
export const extractItemClassObjects = (item: string) => {
  const result: {
    [productName: string]: number;
  } = {};
  const regex = /ItemClass="[^"]*\/([^/]+(?:\.[^"]*)?)",Amount=([0-9]+)/g;
  const matches = Array.from(item.matchAll(regex));
  if (matches.length === 0) {
    console.error("No matches found for item", item);
    return null;
  }
  const first = matches[0][1].split("/").pop()?.split(".").pop()?.replace(/'$/, "");
  const firstAmount = parseInt(matches[0][2]);
  if (!first || !firstAmount) {
    console.error("No matches found for item", item);
    return null;
  }
  for (const match of matches) {
    const name = match[1].split("/").pop()?.split(".").pop()?.replace(/'$/, "");
    if (!name) {
      continue;
    }
    const amount = parseInt(match[2]);
    result[name] = amount;
  }
  return {
    all: result,
    first,
    firstAmount
  };
};
function replaceExceptions(name: string): string {
  const exceptions: { [key: string]: string } = {
    Cement: "Concrete",
    IronIngot: "IngotIron",
    IronScrew: "Screw",
    CompactedCoal: "Alternate_EnrichedCoal",
    TurboFuel: "PackagedTurboFuel",
    MotorLightweight: "MotorTurbo"
  };
  return exceptions[name] || name;
}
export const itemToRecipe = (item: string) => {
  if (item.startsWith("Desc_")) {
    item = item.slice(5, -2);
  } else if (item.startsWith("BP_")) {
    item = item.slice(3, -2);
  }
  return `Recipe_${replaceExceptions(item)}_C`;
};

export const getJSONDirectory = () => {
  return join("src", "parsing", "jsons");
};
