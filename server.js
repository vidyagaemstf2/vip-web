const express = require('express');
const mysql = require('mysql2/promise');
const cors = require('cors');
const passport = require('passport');
const SteamStrategy = require('passport-steam').Strategy;
const session = require('express-session');

const app = express();
app.use(cors({
  origin: 'http://localhost:5173', 
  credentials: true, 
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());

const STEAM_API_KEY = process.env.STEAM_API_KEY; 
const HOST_URL = 'http://localhost:3000'; 

app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production', 
    httpOnly: true,
    sameSite: 'lax',
    maxAge: 24 * 60 * 60 * 1000 
  }
}));

app.use(passport.initialize());
app.use(passport.session());

passport.serializeUser((user, done) => {
  done(null, user);
});

passport.deserializeUser((user, done) => {
  done(null, user);
});

passport.use(new SteamStrategy({
  returnURL: `${HOST_URL}/auth/steam/return`,
  realm: HOST_URL,
  apiKey: STEAM_API_KEY
},
(identifier, profile, done) => {
  return done(null, profile);
}
));

const dbConfig = {
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_DATABASE,
};

const pool = mysql.createPool(dbConfig);

app.get('/api/auth/logout', (req, res) => {
  req.session.destroy(() => {
    res.clearCookie('connect.sid'); 
    res.redirect('http://localhost:5173'); 
  });
});

app.get('/auth/steam',
  passport.authenticate('steam'),
  function(req, res) {
    
  });

app.get('/auth/steam/return',
  passport.authenticate('steam', { failureRedirect: '/' }),
  function(req, res) {
    
    res.redirect('http://localhost:5173'); 
  });

app.get('/api/me', (req, res) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Not authenticated' });
  }
  res.json(req.user);
});

app.get('/api/isAdmin', async (req, res) => {
  if (!req.user) {
    return res.status(401).json({ isAdmin: false });
  }

  try {
    const steamId = req.user.id;
    const [rows] = await pool.query(
      'SELECT * FROM admins WHERE steam_id = ?',
      [steamId]
    );
    res.json({ isAdmin: rows.length > 0 });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

const requireAdmin = async (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Not authenticated' });
  }

  try {
    const [rows] = await pool.query(
      'SELECT * FROM admins WHERE steam_id = ?',
      [req.user.id]
    );
    
    if (rows.length === 0) {
      return res.status(403).json({ error: 'Not authorized' });
    }
    
    next();
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

app.get('/api/vips', async (req, res) => {
  try {
    const [rows] = await pool.query(
      'SELECT * FROM tVip WHERE NOW() < enddate'
    );
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/vips', requireAdmin, async (req, res) => {
  const { playername, playerid, admin_playername, admin_playerid, duration, timeFormat } = req.body;
  
  try {
    
    await pool.query(
      `INSERT INTO tVip (playername, playerid, admin_playername, admin_playerid, timestamp, enddate)
       VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP, DATE_ADD(CURRENT_TIMESTAMP, INTERVAL ? ${timeFormat}))`,
      [playername, playerid, admin_playername, admin_playerid, duration]
    );
    
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/vips/:playerid', requireAdmin, async (req, res) => {
  try {
    await pool.query(
      'DELETE FROM tVip WHERE playerid = ?',
      [req.params.playerid]
    );
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/vips/:playerid/extend', requireAdmin, async (req, res) => {
  const { duration, timeFormat } = req.body;
  
  try {
    await pool.query(
      `UPDATE tVip 
       SET enddate = DATE_ADD(enddate, INTERVAL ? ${timeFormat})
       WHERE playerid = ?`,
      [duration, req.params.playerid]
    );
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/vips/:playerid', requireAdmin, async (req, res) => {
  const { playername, enddate } = req.body;
  
  try {
    await pool.query(
      'UPDATE tVip SET playername = ?, enddate = ? WHERE playerid = ?',
      [playername, new Date(enddate), req.params.playerid]
    );
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});