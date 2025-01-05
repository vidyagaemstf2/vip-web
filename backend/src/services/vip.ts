import { pool } from './database';
import { VipUser, VipLog } from '../types';
import { RowDataPacket } from 'mysql2';

export const vipService = {
  getAllVips: async (): Promise<VipUser[]> => {
    const [rows] = await pool.query<VipUser[]>(
      "SELECT * FROM tVip_vips WHERE NOW() < enddate"
    );
    return rows;
  },

  addVip: async (
    playername: string,
    playerid: string,
    admin_playername: string,
    admin_playerid: string,
    duration: number,
    timeFormat: string
  ): Promise<void> => {
    await pool.query(
      `INSERT INTO tVip_vips (playername, playerid, admin_playername, admin_playerid, timestamp, enddate)
       VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP, DATE_ADD(CURRENT_TIMESTAMP, INTERVAL ? ${timeFormat}))`,
      [playername, playerid, admin_playername, admin_playerid, duration]
    );
  },

  deleteVip: async (playerid: string): Promise<void> => {
    await pool.query("DELETE FROM tVip_vips WHERE playerid = ?", [playerid]);
  },

  extendVip: async (
    playerid: string,
    duration: number,
    timeFormat: string
  ): Promise<void> => {
    await pool.query(
      `UPDATE tVip_vips 
       SET enddate = DATE_ADD(enddate, INTERVAL ? ${timeFormat})
       WHERE playerid = ?`,
      [duration, playerid]
    );
  },

  updateVip: async (
    playerid: string,
    playername: string,
    enddate: string
  ): Promise<void> => {
    await pool.query(
      "UPDATE tVip_vips SET playername = ?, enddate = ? WHERE playerid = ?",
      [playername, new Date(enddate), playerid]
    );
  },

  getLogs: async (userId: string, isAdmin: boolean): Promise<VipLog[]> => {
    let query = `
      SELECT * FROM tVip_logs 
      WHERE 1=1
    `;

    const queryParams: string[] = [];

    if (!isAdmin) {
      query += ` AND target_steamid = ?`;
      queryParams.push(userId);
    }

    query += ` ORDER BY timestamp DESC LIMIT 1000`;

    const [rows] = await pool.query<VipLog[]>(query, queryParams);
    return rows;
  },

  checkIsAdmin: async (steamId: string): Promise<boolean> => {
    const [rows] = await pool.query<RowDataPacket[]>(
      "SELECT * FROM tVip_admins WHERE steam_id = ?",
      [steamId]
    );
    return rows.length > 0;
  }
};