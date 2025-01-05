import { Request, Response, NextFunction } from 'express';
import { pool } from '../services/database';
import { RowDataPacket } from 'mysql2';

export const requireAdmin = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  if (!req.user) {
    res.status(401).json({ error: "Not authenticated" });
    return;
  }

  try {
    const [rows] = await pool.query<RowDataPacket[]>(
      "SELECT * FROM tVip_admins WHERE steam_id = ?",
      [req.user.id]
    );

    if (rows.length === 0) {
      res.status(403).json({ error: "Not authorized" });
      return;
    }

    next();
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
};