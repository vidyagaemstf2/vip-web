import { RowDataPacket } from 'mysql2';

export interface VipUser extends RowDataPacket {
  playername: string;
  playerid: string;
  admin_playername: string;
  admin_playerid: string;
  timestamp: Date;
  enddate: Date;
}

export interface VipLog extends RowDataPacket {
  id: number;
  timestamp: Date;
  target_steamid: string;
  action: string;
}

export interface SteamUser {
  id: string;
  displayName: string;
  photos: { value: string }[];
}

// Request body types
export interface AddVipRequest {
  playername: string;
  playerid: string;
  admin_playername: string;
  admin_playerid: string;
  duration: number;
  timeFormat: string;
}

export interface UpdateVipRequest {
  playername: string;
  enddate: string;
}

export interface ExtendVipRequest {
  duration: number;
  timeFormat: string;
}

// Extend Express types
declare global {
  namespace Express {
    interface User extends SteamUser {}
  }
}

declare module 'express-session' {
  interface SessionData {
    passport: any;
  }
}