import path from "path";

export function getAssetPath(filename: string): string {
  return process.env.NODE_ENV === "production"
    ? path.join(process.cwd(), "dist", "assets", filename)
    : path.join(process.cwd(), "src", "assets", filename);
}
