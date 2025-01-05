import express from 'express';
import cors from 'cors';
import session from 'express-session';
import passport from 'passport';
import config from './config';
import authRoutes from './routes/auth';
import vipRoutes from './routes/vip';

const app = express();

// Middleware setup
app.use(
  cors({
    origin: config.FRONTEND_URL,
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

app.use(express.json());

app.use(
  session({
    secret: process.env.SESSION_SECRET || "default_secret",
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: false, // Set to false for development
      httpOnly: true,
      sameSite: "lax",
      maxAge: 24 * 60 * 60 * 1000,
    },
  })
);

app.use(passport.initialize());
app.use(passport.session());

// Route setup with normalized paths
app.use('/auth', authRoutes);     // All authentication related routes
app.use('/api/vips', vipRoutes);  // All VIP management routes

app.listen(config.PORT, () => {
  console.log(`Server running on port ${config.PORT}`);
});

export default app;