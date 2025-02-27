import { copyFile, readdir, stat } from "fs/promises";
import { join, parse } from "path";

// EXTRACT PNGS TO FLAT DIRECTORY
const assets = join("src", "public", "icons");
export async function extract256Pngs(directory: string) {
  const dir = await readdir(directory);
  for (const file of dir) {
    const link = await stat(join(directory, file));
    if (link.isDirectory()) {
      await extract256Pngs(join(directory, file));
    } else if (file.endsWith(".png") && parse(file).name.endsWith("_256")) {
      // write to flat directory
      await copyFile(join(directory, file), join(assets, parse(file).name.split("_256")[0] + ".png"));
    } else {
      console.log("Skipping", file);
    }
  }
}
