import { Router } from 'express';
import passport from 'passport';
import { Strategy as SteamStrategy } from 'passport-steam';
import config from '../config';
import { vipService } from '../services/vip';
import { SteamUser } from '../types';

const router = Router();

// Passport configuration
passport.serializeUser((user: Express.User, done) => {
  done(null, user);
});

passport.deserializeUser((user: Express.User, done) => {
  done(null, user);
});

passport.use(
  new SteamStrategy(
    {
      returnURL: `${config.HOST_URL}/auth/steam/return`,
      realm: config.HOST_URL,
      apiKey: config.STEAM_API_KEY,
    },
    (identifier: string, profile: SteamUser, done: (error: any, user?: any) => void) => done(null, profile)
  )
);

// Routes
// GET /auth/steam - Start Steam authentication
router.get('/steam', passport.authenticate('steam'));

// GET /auth/steam/return - Steam authentication callback
router.get(
  '/steam/return',
  passport.authenticate('steam', { failureRedirect: '/' }),
  (req, res) => res.redirect(config.FRONTEND_URL)
);

// POST /auth/logout - Logout user
router.post('/logout', (req, res) => {
  req.session.destroy(() => {
    res.clearCookie("connect.sid");
    res.json({ success: true });
  });
});

// GET /auth/me - Get current user information
router.get('/me', (req, res) => {
  if (!req.user) {
    res.status(401).json({ error: "Not authenticated" });
    return;
  }
  res.json(req.user);
});

// GET /auth/admin-status - Check if current user is admin
router.get('/admin-status', async (req, res) => {
  if (!req.user) {
    res.json({ isAdmin: false });
    return;
  }

  try {
    const isAdmin = await vipService.checkIsAdmin(req.user.id);
    res.json({ isAdmin });
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

export default router;