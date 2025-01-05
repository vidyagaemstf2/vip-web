import { Router } from 'express';
import { requireAdmin } from '../middleware/auth';
import { vipService } from '../services/vip';
import { AddVipRequest, UpdateVipRequest, ExtendVipRequest } from '../types';

const router = Router();

// GET /api/vips - Get all VIPs
router.get('/', async (req, res) => {
  try {
    const vips = await vipService.getAllVips();
    res.json(vips);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

// POST /api/vips - Create new VIP
router.post('/', requireAdmin, async (req, res) => {
  try {
    const {
      playername,
      playerid,
      admin_playername,
      admin_playerid,
      duration,
      timeFormat,
    } = req.body as AddVipRequest;

    await vipService.addVip(
      playername,
      playerid,
      admin_playername,
      admin_playerid,
      duration,
      timeFormat
    );
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

// PUT /api/vips/:playerid - Update VIP
router.put('/:playerid', requireAdmin, async (req, res) => {
  try {
    const { playername, enddate } = req.body as UpdateVipRequest;
    await vipService.updateVip(req.params.playerid, playername, enddate);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

// PUT /api/vips/:playerid/extend - Extend VIP duration
router.put('/:playerid/extend', requireAdmin, async (req, res) => {
  try {
    const { duration, timeFormat } = req.body as ExtendVipRequest;
    await vipService.extendVip(req.params.playerid, duration, timeFormat);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

// DELETE /api/vips/:playerid - Delete VIP
router.delete('/:playerid', requireAdmin, async (req, res) => {
  try {
    await vipService.deleteVip(req.params.playerid);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

// GET /api/vips/logs - Get VIP logs
router.get('/logs', async (req, res) => {
  try {
    if (!req.user) {
      res.status(401).json({ error: "Not authenticated" });
      return;
    }

    const isAdmin = await vipService.checkIsAdmin(req.user.id);
    const logs = await vipService.getLogs(req.user.id, isAdmin);
    res.json(logs);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

export default router;