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
    let offset = 6; // Skip header and response type

    const getString = (): string => {
      let str = "";
      while (buffer[offset] !== 0x00 && offset < buffer.length) {
        str += String.fromCharCode(buffer[offset]);
        offset++;
      }
      offset++; // Skip null terminator
      return str;
    };

    const getByte = (): number => buffer[offset++];

    return {
      protocol: getByte(),
      name: getString(),
      map: getString(),
      folder: getString(),
      game: getString(),
      players: getByte(),
      maxPlayers: getByte(),
      bots: getByte(),
      serverType: String.fromCharCode(getByte()),
      environment: String.fromCharCode(getByte()),
      visibility: getByte(),
      vac: getByte(),
      version: getString(),
      port: buffer.readUInt16LE(offset),
    };
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
