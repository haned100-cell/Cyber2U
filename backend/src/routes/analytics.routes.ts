import { Router, Request, Response } from 'express';
import { authenticateToken } from '../middleware/auth';
import {
  getCampaignAnalytics,
  getQuarterlyReport,
  getSummaryAnalytics,
  recalculateCampaignAnalytics,
} from '../services/analytics.service';
import { createAuditLog } from '../services/auth.service';

const router = Router();

router.use(authenticateToken);

router.get('/summary', async (req: Request, res: Response) => {
  try {
    const summary = await getSummaryAnalytics();
    res.json({ summary });
  } catch (error) {
    console.error('Analytics summary error:', error);
    res.status(500).json({ error: 'Failed to fetch analytics summary' });
  }
});

router.get('/campaigns/:id', async (req: Request, res: Response) => {
  try {
    const campaignId = Number(req.params.id);
    if (!Number.isInteger(campaignId) || campaignId <= 0) {
      res.status(400).json({ error: 'Invalid campaign id' });
      return;
    }

    const campaign = await getCampaignAnalytics(campaignId);
    res.json({ campaign });
  } catch (error) {
    if (error instanceof Error && error.message.includes('not found')) {
      res.status(404).json({ error: error.message });
      return;
    }

    console.error('Campaign analytics error:', error);
    res.status(500).json({ error: 'Failed to fetch campaign analytics' });
  }
});

router.post('/campaigns/:id/recalculate', async (req: Request, res: Response) => {
  try {
    const campaignId = Number(req.params.id);
    if (!Number.isInteger(campaignId) || campaignId <= 0) {
      res.status(400).json({ error: 'Invalid campaign id' });
      return;
    }

    const campaign = await recalculateCampaignAnalytics(campaignId);

    await createAuditLog(
      req.userId ?? null,
      'analytics_recalculated',
      'campaign',
      campaignId,
      null,
      { campaignId },
      req.ip,
      req.headers['user-agent']
    );

    res.json({ campaign });
  } catch (error) {
    if (error instanceof Error && error.message.includes('not found')) {
      res.status(404).json({ error: error.message });
      return;
    }

    console.error('Recalculate campaign analytics error:', error);
    res.status(500).json({ error: 'Failed to recalculate campaign analytics' });
  }
});

router.get('/quarterly-report', async (req: Request, res: Response) => {
  try {
    const currentYear = new Date().getUTCFullYear();
    const year = req.query.year ? Number(req.query.year) : currentYear;
    const quarter = req.query.quarter ? Number(req.query.quarter) : Math.floor((new Date().getUTCMonth() + 3) / 3);

    if (!Number.isInteger(year) || year < 2020 || year > 2100) {
      res.status(400).json({ error: 'Invalid year' });
      return;
    }

    if (!Number.isInteger(quarter) || quarter < 1 || quarter > 4) {
      res.status(400).json({ error: 'Invalid quarter (1-4)' });
      return;
    }

    const report = await getQuarterlyReport(year, quarter);
    res.json({ report });
  } catch (error) {
    console.error('Quarterly report error:', error);
    res.status(500).json({ error: 'Failed to generate quarterly report' });
  }
});

export default router;
