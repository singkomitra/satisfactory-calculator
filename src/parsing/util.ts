// ex: ((ItemClass=\"/Script/Engine.BlueprintGeneratedClass'/Game/FactoryGame/Resource/Parts/Computer/Desc_Computer.Desc_Computer_C'\",Amount=4),(ItemClass=\"/Script/Engine.BlueprintGeneratedClass'/Game/FactoryGame/Resource/Parts/CircuitBoardHighSpeed/Desc_CircuitBoardHighSpeed.Desc_CircuitBoardHighSpeed_C'\",Amount=2),(ItemClass=\"/Script/Engine.BlueprintGeneratedClass'/Game/FactoryGame/Resource/Parts/HighSpeedConnector/Desc_HighSpeedConnector.Desc_HighSpeedConnector_C'\",Amount=3),(ItemClass=\"/Script/Engine.BlueprintGeneratedClass'/Game/FactoryGame/Resource/Parts/Plastic/Desc_Plastic.Desc_Plastic_C'\",Amount=28))
export const extractItemClassForProduct = (item: string) => {
    const result: {
        [productName: string]: number;
    } = {}
    const regex = /ItemClass="[^"]*\/([^/]+(?:\.[^"]*)?)",Amount=([0-9]+)/g;
    const matches = Array.from(item.matchAll(regex));
    if (matches.length === 0) {
        console.error("No matches found for item", item)
        return null
    }
    for (const match of matches) {
        const name = match[1].split("/").pop()?.split(".").pop()
        if (!name) {
            continue;
        }
        const amount = parseInt(match[2])
        result[name] = amount
    }
    return {
        products: result,
        mainProduct: matches[0][1].split("/").pop()?.split(".").pop()
    }
}
