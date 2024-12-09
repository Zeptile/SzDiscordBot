export interface ServerInfo {
  protocol: number;
  name: string;
  map: string;
  folder: string;
  game: string;
  id: number;
  players: number;
  maxPlayers: number;
  bots: number;
  serverType: string;
  environment: string;
  visibility: number;
  vac: number;
  version: string;
  port?: number;
}
