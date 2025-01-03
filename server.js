// Import statements
const express = require("express");
const mysql = require("mysql2/promise");
const cors = require("cors");
const passport = require("passport");
const SteamStrategy = require("passport-steam").Strategy;
const session = require("express-session");
require("dotenv").config();

// Configuration constants
const CONFIG = {
  PORT: process.env.PORT || 3000,
  HOST_URL: "http://localhost:3000",
  FRONTEND_URL: "http://localhost:5173",
  DB: {
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_DATABASE,
  },
  STEAM_API_KEY: process.env.STEAM_API_KEY,
};

// Initialize Express app
const app = express();

// Database connection
const pool = mysql.createPool(CONFIG.DB);

// Middleware setup
const setupMiddleware = (app) => {
  app.use(
    cors({
      origin: CONFIG.FRONTEND_URL,
      credentials: true,
      methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
      allowedHeaders: ["Content-Type", "Authorization"],
    })
  );

  app.use(express.json());

  app.use(
    session({
      secret: process.env.SESSION_SECRET,
      resave: false,
      saveUninitialized: false,
      cookie: {
        secure: process.env.NODE_ENV === "production",
        httpOnly: true,
        sameSite: "lax",
        maxAge: 24 * 60 * 60 * 1000,
      },
    })
  );

  app.use(passport.initialize());
  app.use(passport.session());
};

// Passport configuration
const configurePassport = () => {
  passport.serializeUser((user, done) => done(null, user));
  passport.deserializeUser((user, done) => done(null, user));

  passport.use(
    new SteamStrategy(
      {
        returnURL: `${CONFIG.HOST_URL}/auth/steam/return`,
        realm: CONFIG.HOST_URL,
        apiKey: CONFIG.STEAM_API_KEY,
      },
      (identifier, profile, done) => done(null, profile)
    )
  );
};

// Middleware for admin authentication
const requireAdmin = async (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ error: "Not authenticated" });
  }

  try {
    const [rows] = await pool.query(
      "SELECT * FROM tVip_admins WHERE steam_id = ?",
      [req.user.id]
    );

    if (rows.length === 0) {
      return res.status(403).json({ error: "Not authorized" });
    }

    next();
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Authentication routes
const authRoutes = {
  logout: (req, res) => {
    req.session.destroy(() => {
      res.clearCookie("connect.sid");
      res.redirect(CONFIG.FRONTEND_URL);
    });
  },

  steamAuth: passport.authenticate("steam"),

  steamReturn: [
    passport.authenticate("steam", { failureRedirect: "/" }),
    (req, res) => res.redirect(CONFIG.FRONTEND_URL),
  ],

  getMe: (req, res) => {
    if (!req.user) {
      return res.status(401).json({ error: "Not authenticated" });
    }
    res.json(req.user);
  },

  isAdmin: async (req, res) => {
    if (!req.user) {
      return res.status(401).json({ isAdmin: false });
    }

    try {
      const [rows] = await pool.query(
        "SELECT * FROM tVip_admins WHERE steam_id = ?",
        [req.user.id]
      );
      res.json({ isAdmin: rows.length > 0 });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },
};

// VIP management routes
const vipRoutes = {
  getAllVips: async (req, res) => {
    try {
      const [rows] = await pool.query(
        "SELECT * FROM tVip_vips WHERE NOW() < enddate"
      );
      res.json(rows);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  addVip: async (req, res) => {
    const {
      playername,
      playerid,
      admin_playername,
      admin_playerid,
      duration,
      timeFormat,
    } = req.body;

    try {
      await pool.query(
        `INSERT INTO tVip_vips (playername, playerid, admin_playername, admin_playerid, timestamp, enddate)
         VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP, DATE_ADD(CURRENT_TIMESTAMP, INTERVAL ? ${timeFormat}))`,
        [playername, playerid, admin_playername, admin_playerid, duration]
      );

      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  deleteVip: async (req, res) => {
    try {
      await pool.query("DELETE FROM tVip_vips WHERE playerid = ?", [
        req.params.playerid,
      ]);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  extendVip: async (req, res) => {
    const { duration, timeFormat } = req.body;

    try {
      await pool.query(
        `UPDATE tVip_vips 
         SET enddate = DATE_ADD(enddate, INTERVAL ? ${timeFormat})
         WHERE playerid = ?`,
        [duration, req.params.playerid]
      );
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  updateVip: async (req, res) => {
    const { playername, enddate } = req.body;

    try {
      await pool.query(
        "UPDATE tVip_vips SET playername = ?, enddate = ? WHERE playerid = ?",
        [playername, new Date(enddate), req.params.playerid]
      );
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  getLogs: async (req, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({ error: "Not authenticated" });
      }

      // Use the same admin check as isAdmin route
      const [adminRows] = await pool.query(
        "SELECT * FROM tVip_admins WHERE steam_id = ?",
        [req.user.id]
      );
      const isAdmin = adminRows.length > 0;

      let query = `
        SELECT * FROM tVip_logs 
        WHERE 1=1
      `;

      const queryParams = [];

      // If not admin, only show logs for the user
      if (!isAdmin) {
        query += ` AND target_steamid = ?`;
        queryParams.push(req.user.id);
      }

      query += ` ORDER BY timestamp DESC LIMIT 1000`;

      const [rows] = await pool.query(query, queryParams);
      res.json(rows);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },
};

// Route setup
const setupRoutes = (app) => {
  // Auth routes
  app.get("/api/auth/logout", authRoutes.logout);
  app.get("/auth/steam", authRoutes.steamAuth);
  app.get("/auth/steam/return", ...authRoutes.steamReturn);
  app.get("/api/me", authRoutes.getMe);
  app.get("/api/isAdmin", authRoutes.isAdmin);

  // VIP routes
  app.get("/api/vips", vipRoutes.getAllVips);
  app.get("/api/vip-logs", vipRoutes.getLogs);
  app.post("/api/vips", requireAdmin, vipRoutes.addVip);
  app.delete("/api/vips/:playerid", requireAdmin, vipRoutes.deleteVip);
  app.put("/api/vips/:playerid/extend", requireAdmin, vipRoutes.extendVip);
  app.put("/api/vips/:playerid", requireAdmin, vipRoutes.updateVip);
};

// Initialize application
const initializeApp = () => {
  setupMiddleware(app);
  configurePassport();
  setupRoutes(app);

  app.listen(CONFIG.PORT, () => {
    console.log(`Server running on port ${CONFIG.PORT}`);
  });
};

// Start the server
initializeApp();
