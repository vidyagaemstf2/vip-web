import dotenv from 'dotenv';

dotenv.config();

export interface Config {
  PORT: number;
  HOST_URL: string;
  FRONTEND_URL: string;
  DB: {
    host: string;
    user: string;
    password: string;
    database: string;
  };
  STEAM_API_KEY: string;
}

const config: Config = {
  PORT: parseInt(process.env.PORT || "3000", 10),
  HOST_URL: "http://localhost:3000",
  FRONTEND_URL: "http://localhost:5173",
  DB: {
    host: process.env.DB_HOST || "",
    user: process.env.DB_USER || "",
    password: process.env.DB_PASSWORD || "",
    database: process.env.DB_DATABASE || "",
  },
  STEAM_API_KEY: process.env.STEAM_API_KEY || "",
};

export default config;