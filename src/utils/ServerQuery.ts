import dgram from "dgram";
import { ServerInfo } from "../types/ServerInfo";

const CHALLENGE_BYTE = 0x41;
const VALID_RESPONSE_BYTE = 0x49;
const TIMEOUT_MS = 10000;

export class ServerQuery {
  private host: string;
  private port: number;

  constructor(host: string, port: number) {
    this.host = host;
    this.port = port;
  }

  private buildQuery(challenge?: Buffer): Buffer {
    const header = Buffer.from([0xff, 0xff, 0xff, 0xff, 0x54]);
    const body = Buffer.from("Source Engine Query\0");

    if (challenge) {
      return Buffer.concat([header, body, challenge]);
    }
    return Buffer.concat([header, body]);
  }

  private parseResponse(buffer: Buffer): ServerInfo {
    let offset = 5; // Skip header (4 bytes) and response type (1 byte)

    const getString = (): string => {
      const bytes: number[] = [];
      while (offset < buffer.length && buffer[offset] !== 0x00) {
        bytes.push(buffer[offset]);
        offset++;
      }
      offset++; // Skip null terminator
      return Buffer.from(bytes).toString("ascii");
    };

    const getByte = (): number => buffer[offset++];

    const getShort = (): number => {
      const value = buffer[offset] | (buffer[offset + 1] << 8);
      offset += 2;
      return value;
    };

    const getCharacter = (): string => {
      return Buffer.from([buffer[offset++]]).toString("ascii");
    };

    const info: ServerInfo = {
      protocol: getByte(),
      name: getString(),
      map: getString(),
      folder: getString(),
      game: getString(),
      id: getShort(),
      players: getByte(),
      maxPlayers: getByte(),
      bots: getByte(),
      serverType: getCharacter(),
      environment: getCharacter(),
      visibility: getByte(),
      vac: getByte(),
      version: getString(),
    };

    // Handle EDF (Extra Data Flag)
    const edf = getByte();
    if ((edf & 0x80) !== 0) {
      info.port = getShort();
    }

    return info;
  }

  public async getServerInfo(): Promise<ServerInfo> {
    return new Promise((resolve, reject) => {
      const client = dgram.createSocket("udp4");

      const timeoutId = setTimeout(() => {
        client.close();
        reject(new Error(`Query timeout after ${TIMEOUT_MS}ms`));
      }, TIMEOUT_MS);

      const cleanup = () => {
        clearTimeout(timeoutId);
        client.close();
      };

      client.on("message", async (response: Buffer) => {
        if (response[4] === CHALLENGE_BYTE) {
          const challenge = Buffer.from(response.slice(5));
          const challengeQuery = this.buildQuery(challenge);

          client.send(challengeQuery, this.port, this.host);
        }

        if (response[4] === VALID_RESPONSE_BYTE) {
          cleanup();
          resolve(this.parseResponse(response));
        }
      });

      client.on("error", (err) => {
        cleanup();
        reject(err);
      });

      const query = this.buildQuery();
      client.send(query, this.port, this.host);
    });
  }
}
