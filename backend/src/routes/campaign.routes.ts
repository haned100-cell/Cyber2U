import { Router, Request, Response } from 'express';
import { authenticateToken } from '../middleware/auth';
import {
  approveCampaign,
  createCampaign,
  getCampaignById,
  getCampaignVersions,
  listCampaigns,
  runDueScheduledCampaigns,
  scheduleCampaign,
  sendCampaignNow,
  submitCampaignForReview,
  updateCampaign,
} from '../services/campaign.service';
import { createAuditLog } from '../services/auth.service';

const router = Router();

router.use(authenticateToken);

router.get('/', async (req: Request, res: Response) => {
  try {
    const status = typeof req.query.status === 'string' ? req.query.status : undefined;
    const campaignType = typeof req.query.campaignType === 'string' ? req.query.campaignType : undefined;
    const campaigns = await listCampaigns(status, campaignType);
    res.json({ campaigns });
  } catch (error) {
    console.error('List campaigns error:', error);
    res.status(500).json({ error: 'Failed to list campaigns' });
  }
});

router.get('/:id', async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id <= 0) {
      res.status(400).json({ error: 'Invalid campaign id' });
      return;
    }

    const campaign = await getCampaignById(id);
    if (!campaign) {
      res.status(404).json({ error: 'Campaign not found' });
      return;
    }

    const versions = await getCampaignVersions(id);
    res.json({ campaign, versions });
  } catch (error) {
    console.error('Get campaign error:', error);
    res.status(500).json({ error: 'Failed to get campaign' });
  }
});

router.post('/', async (req: Request, res: Response) => {
  try {
    const { title, description, campaignType, subjectLine, emailBodyHtml, emailBodyText, caseStudyContent } = req.body;

    if (!title || !campaignType) {
      res.status(400).json({ error: 'title and campaignType are required' });
      return;
    }

    const campaign = await createCampaign(req.userId ?? null, {
      title,
      description,
      campaignType,
      subjectLine,
      emailBodyHtml,
      emailBodyText,
      caseStudyContent,
    });

    await createAuditLog(req.userId ?? null, 'campaign_created', 'campaign', campaign.id, null, campaign, req.ip, req.headers['user-agent']);

    res.status(201).json({ campaign });
  } catch (error) {
    console.error('Create campaign error:', error);
    res.status(500).json({ error: 'Failed to create campaign' });
  }
});

router.put('/:id', async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id <= 0) {
      res.status(400).json({ error: 'Invalid campaign id' });
      return;
    }

    const campaign = await updateCampaign(id, req.userId ?? null, req.body || {});
    await createAuditLog(req.userId ?? null, 'campaign_updated', 'campaign', id, null, req.body || {}, req.ip, req.headers['user-agent']);

    res.json({ campaign });
  } catch (error) {
    if (error instanceof Error && error.message.includes('not found')) {
      res.status(404).json({ error: error.message });
      return;
    }

    console.error('Update campaign error:', error);
    res.status(500).json({ error: 'Failed to update campaign' });
  }
});

router.post('/:id/submit-review', async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id <= 0) {
      res.status(400).json({ error: 'Invalid campaign id' });
      return;
    }

    const campaign = await submitCampaignForReview(id);
    await createAuditLog(req.userId ?? null, 'campaign_submitted_review', 'campaign', id, null, { status: 'review' }, req.ip, req.headers['user-agent']);

    res.json({ campaign });
  } catch (error) {
    if (error instanceof Error && error.message.includes('not found')) {
      res.status(404).json({ error: error.message });
      return;
    }

    console.error('Submit review error:', error);
    res.status(500).json({ error: 'Failed to submit campaign for review' });
  }
});

router.post('/:id/approve', async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    const reviewNotes = typeof req.body?.reviewNotes === 'string' ? req.body.reviewNotes : undefined;

    if (!Number.isInteger(id) || id <= 0) {
      res.status(400).json({ error: 'Invalid campaign id' });
      return;
    }

    const campaign = await approveCampaign(id, req.userId ?? null, reviewNotes);
    await createAuditLog(req.userId ?? null, 'campaign_approved', 'campaign', id, null, { status: 'approved', reviewNotes }, req.ip, req.headers['user-agent']);

    res.json({ campaign });
  } catch (error) {
    if (error instanceof Error && error.message.includes('not found')) {
      res.status(404).json({ error: error.message });
      return;
    }

    console.error('Approve campaign error:', error);
    res.status(500).json({ error: 'Failed to approve campaign' });
  }
});

router.post('/:id/schedule', async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    const scheduledSendAt = req.body?.scheduledSendAt as string | undefined;

    if (!Number.isInteger(id) || id <= 0) {
      res.status(400).json({ error: 'Invalid campaign id' });
      return;
    }

    if (!scheduledSendAt) {
      res.status(400).json({ error: 'scheduledSendAt is required' });
      return;
    }

    const campaign = await scheduleCampaign(id, scheduledSendAt);
    await createAuditLog(req.userId ?? null, 'campaign_scheduled', 'campaign', id, null, { status: 'scheduled', scheduledSendAt }, req.ip, req.headers['user-agent']);

    res.json({ campaign });
  } catch (error) {
    if (error instanceof Error && /not found|Invalid schedule/.test(error.message)) {
      res.status(400).json({ error: error.message });
      return;
    }

    console.error('Schedule campaign error:', error);
    res.status(500).json({ error: 'Failed to schedule campaign' });
  }
});

router.post('/:id/send-now', async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id <= 0) {
      res.status(400).json({ error: 'Invalid campaign id' });
      return;
    }

    const result = await sendCampaignNow(id);
    await createAuditLog(req.userId ?? null, 'campaign_sent_now', 'campaign', id, null, { recipientCount: result.recipientCount }, req.ip, req.headers['user-agent']);

    res.json(result);
  } catch (error) {
    if (error instanceof Error && error.message.includes('not found')) {
      res.status(404).json({ error: error.message });
      return;
    }

    console.error('Send campaign now error:', error);
    res.status(500).json({ error: 'Failed to send campaign' });
  }
});

router.post('/run-scheduled', async (req: Request, res: Response) => {
  try {
    const results = await runDueScheduledCampaigns();
    await createAuditLog(req.userId ?? null, 'campaign_scheduler_run', 'campaign', undefined, null, { processed: results.length }, req.ip, req.headers['user-agent']);
    res.json({ processed: results.length, results });
  } catch (error) {
    console.error('Run scheduled campaigns error:', error);
    res.status(500).json({ error: 'Failed to run scheduler' });
  }
});

export default router;
