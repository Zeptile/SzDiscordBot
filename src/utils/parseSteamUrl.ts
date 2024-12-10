export class SteamUrlError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "SteamUrlError";
  }
}

export function parseSteamUrl(url: string): { host: string; port: number } {
  if (!url || typeof url !== "string") {
    throw new SteamUrlError("URL must be a non-empty string");
  }

  // Handle steam:// protocol URLs
  if (url.startsWith("steam://connect/")) {
    const cleanUrl = url.replace("steam://connect/", "");
    const [host, portStr] = cleanUrl.split(":");

    if (!host) {
      throw new SteamUrlError("Invalid steam:// URL: missing host");
    }

    const port = portStr ? parseInt(portStr, 10) : 27015;
    if (isNaN(port)) {
      throw new SteamUrlError("Invalid steam:// URL: port must be a number");
    }

    return { host, port };
  }

  // Handle regular URLs with IP:PORT format
  if (url.includes(":")) {
    const [host, portStr] = url.split(":");

    if (!host) {
      throw new SteamUrlError("Invalid URL: missing host");
    }

    const port = parseInt(portStr, 10);
    if (isNaN(port)) {
      throw new SteamUrlError("Invalid URL: port must be a number");
    }

    return { host, port };
  }

  throw new SteamUrlError(
    "Invalid URL format. Use either IP:PORT or steam://connect/IP:PORT"
  );
}
