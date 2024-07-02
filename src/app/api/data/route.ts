import { readFile } from "fs/promises";

export async function GET(req: Request) {
    const json = await readFile('Docs.json', 'utf-16le')
    console.log(JSON.parse(json))
    return Response.json(JSON.parse(json))
}