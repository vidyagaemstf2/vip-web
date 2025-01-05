import mysql, { Pool } from 'mysql2/promise';
import config from '../config';

export const pool: Pool = mysql.createPool(config.DB);