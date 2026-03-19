import { PoolClient } from 'pg';
import { pool } from '../db';
import { sendEmail } from './email.service';

export type CampaignStatus = 'draft' | 'review' | 'approved' | 'scheduled' | 'sent' | 'archived';

export interface CampaignInput {
  title: string;
  description?: string;
  campaignType: string;
  subjectLine?: string;
  emailBodyHtml?: string;
  emailBodyText?: string;
  caseStudyContent?: string;
}

export interface CampaignRecord {
  id: number;
  title: string;
  description: string | null;
  campaign_type: string;
  status: CampaignStatus;
  created_by: number | null;
  created_at: string;
  updated_at: string;
  published_at: string | null;
  scheduled_send_at: string | null;
}

async function getLatestVersionNumber(client: PoolClient, campaignId: number): Promise<number> {
  const result = await client.query(
    `SELECT COALESCE(MAX(version_number), 0)::int AS max_version
     FROM campaign_versions
     WHERE campaign_id = $1`,
    [campaignId]
  );

  return result.rows[0].max_version as number;
}

export async function listCampaigns(status?: string, campaignType?: string): Promise<CampaignRecord[]> {
  const conditions: string[] = [];
  const values: Array<string> = [];

  if (status) {
    values.push(status);
    conditions.push(`status = $${values.length}`);
  }

  if (campaignType) {
    values.push(campaignType);
    conditions.push(`campaign_type = $${values.length}`);
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

  const result = await pool.query(
    `SELECT *
     FROM campaigns
     ${whereClause}
     ORDER BY updated_at DESC, id DESC`,
    values
  );

  return result.rows as CampaignRecord[];
}

export async function getCampaignById(campaignId: number): Promise<CampaignRecord | null> {
  const result = await pool.query('SELECT * FROM campaigns WHERE id = $1', [campaignId]);
  if (result.rows.length === 0) {
    return null;
  }

  return result.rows[0] as CampaignRecord;
}

export async function getCampaignVersions(campaignId: number): Promise<Array<Record<string, unknown>>> {
  const result = await pool.query(
    `SELECT id, campaign_id, version_number, title, subject_line, email_body_html, email_body_text,
            case_study_content, status, created_by, created_at, review_notes, reviewed_by, reviewed_at
     FROM campaign_versions
     WHERE campaign_id = $1
     ORDER BY version_number DESC`,
    [campaignId]
  );

  return result.rows as Array<Record<string, unknown>>;
}

export async function createCampaign(createdBy: number | null, input: CampaignInput): Promise<CampaignRecord> {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    const campaignResult = await client.query(
      `INSERT INTO campaigns (title, description, campaign_type, status, created_by)
       VALUES ($1, $2, $3, 'draft', $4)
       RETURNING *`,
      [input.title, input.description || null, input.campaignType, createdBy]
    );

    const campaign = campaignResult.rows[0] as CampaignRecord;

    await client.query(
      `INSERT INTO campaign_versions (
         campaign_id,
         version_number,
         title,
         subject_line,
         email_body_html,
         email_body_text,
         case_study_content,
         status,
         created_by
       ) VALUES ($1, 1, $2, $3, $4, $5, $6, 'draft', $7)`,
      [
        campaign.id,
        input.title,
        input.subjectLine || null,
        input.emailBodyHtml || null,
        input.emailBodyText || null,
        input.caseStudyContent || null,
        createdBy,
      ]
    );

    await client.query('COMMIT');
    return campaign;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

export async function updateCampaign(
  campaignId: number,
  updatedBy: number | null,
  input: Partial<CampaignInput>
): Promise<CampaignRecord> {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    const currentResult = await client.query('SELECT * FROM campaigns WHERE id = $1', [campaignId]);
    if (currentResult.rows.length === 0) {
      throw new Error('Campaign not found');
    }

    const current = currentResult.rows[0] as CampaignRecord;

    const title = input.title ?? current.title;
    const description = input.description ?? current.description;
    const campaignType = input.campaignType ?? current.campaign_type;

    const updatedResult = await client.query(
      `UPDATE campaigns
       SET title = $2,
           description = $3,
           campaign_type = $4,
           updated_at = NOW()
       WHERE id = $1
       RETURNING *`,
      [campaignId, title, description, campaignType]
    );

    const nextVersion = (await getLatestVersionNumber(client, campaignId)) + 1;

    const latestVersion = await client.query(
      `SELECT subject_line, email_body_html, email_body_text, case_study_content
       FROM campaign_versions
       WHERE campaign_id = $1
       ORDER BY version_number DESC
       LIMIT 1`,
      [campaignId]
    );

    const base = latestVersion.rows[0] || {};

    await client.query(
      `INSERT INTO campaign_versions (
         campaign_id,
         version_number,
         title,
         subject_line,
         email_body_html,
         email_body_text,
         case_study_content,
         status,
         created_by
       ) VALUES ($1, $2, $3, $4, $5, $6, $7, 'draft', $8)`,
      [
        campaignId,
        nextVersion,
        title,
        input.subjectLine ?? base.subject_line ?? null,
        input.emailBodyHtml ?? base.email_body_html ?? null,
        input.emailBodyText ?? base.email_body_text ?? null,
        input.caseStudyContent ?? base.case_study_content ?? null,
        updatedBy,
      ]
    );

    await client.query('COMMIT');

    return updatedResult.rows[0] as CampaignRecord;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

async function setCampaignStatus(
  campaignId: number,
  status: CampaignStatus,
  reviewNotes: string | null = null,
  reviewedBy: number | null = null
): Promise<CampaignRecord> {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const campaignResult = await client.query('SELECT * FROM campaigns WHERE id = $1', [campaignId]);
    if (campaignResult.rows.length === 0) {
      throw new Error('Campaign not found');
    }

    const updatedResult = await client.query(
      `UPDATE campaigns
       SET status = $2, updated_at = NOW()
       WHERE id = $1
       RETURNING *`,
      [campaignId, status]
    );

    if (status === 'review' || status === 'approved') {
      await client.query(
        `UPDATE campaign_versions
         SET status = $2,
             review_notes = $3,
             reviewed_by = $4,
             reviewed_at = CASE WHEN $4 IS NOT NULL THEN NOW() ELSE reviewed_at END
         WHERE id = (
           SELECT id FROM campaign_versions
           WHERE campaign_id = $1
           ORDER BY version_number DESC
           LIMIT 1
         )`,
        [campaignId, status, reviewNotes, reviewedBy]
      );
    }

    await client.query('COMMIT');
    return updatedResult.rows[0] as CampaignRecord;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

export async function submitCampaignForReview(campaignId: number): Promise<CampaignRecord> {
  return setCampaignStatus(campaignId, 'review');
}

export async function approveCampaign(
  campaignId: number,
  reviewedBy: number | null,
  reviewNotes?: string
): Promise<CampaignRecord> {
  return setCampaignStatus(campaignId, 'approved', reviewNotes || null, reviewedBy);
}

export async function scheduleCampaign(campaignId: number, scheduledAtIso: string): Promise<CampaignRecord> {
  const scheduledDate = new Date(scheduledAtIso);
  if (Number.isNaN(scheduledDate.getTime())) {
    throw new Error('Invalid schedule datetime');
  }

  const result = await pool.query(
    `UPDATE campaigns
     SET status = 'scheduled',
         scheduled_send_at = $2,
         updated_at = NOW()
     WHERE id = $1
     RETURNING *`,
    [campaignId, scheduledDate.toISOString()]
  );

  if (result.rows.length === 0) {
    throw new Error('Campaign not found');
  }

  return result.rows[0] as CampaignRecord;
}

async function latestVersionForCampaign(campaignId: number): Promise<{
  subject_line: string | null;
  email_body_html: string | null;
  email_body_text: string | null;
}> {
  const result = await pool.query(
    `SELECT subject_line, email_body_html, email_body_text
     FROM campaign_versions
     WHERE campaign_id = $1
     ORDER BY version_number DESC
     LIMIT 1`,
    [campaignId]
  );

  if (result.rows.length === 0) {
    return {
      subject_line: null,
      email_body_html: null,
      email_body_text: null,
    };
  }

  return result.rows[0] as {
    subject_line: string | null;
    email_body_html: string | null;
    email_body_text: string | null;
  };
}

export async function sendCampaignNow(campaignId: number): Promise<{ campaign: CampaignRecord; recipientCount: number }> {
  const campaignResult = await pool.query('SELECT * FROM campaigns WHERE id = $1', [campaignId]);
  if (campaignResult.rows.length === 0) {
    throw new Error('Campaign not found');
  }

  const campaign = campaignResult.rows[0] as CampaignRecord;
  const version = await latestVersionForCampaign(campaignId);

  const users = await pool.query(
    `SELECT id, email
     FROM users
     WHERE is_active = true`
  );

  for (const user of users.rows) {
    const subject = version.subject_line || `${campaign.title} - Cyber2U`;
    const textBody = version.email_body_text || 'New Cyber2U learning content is available.';
    const htmlBody = version.email_body_html || `<p>${textBody}</p>`;

    await sendEmail({
      to: user.email as string,
      subject,
      html: htmlBody,
      text: textBody,
    });

    await pool.query(
      `INSERT INTO campaign_deliveries (campaign_id, user_id)
       VALUES ($1, $2)`,
      [campaignId, user.id]
    );
  }

  const updated = await pool.query(
    `UPDATE campaigns
     SET status = 'sent',
         published_at = NOW(),
         updated_at = NOW()
     WHERE id = $1
     RETURNING *`,
    [campaignId]
  );

  return {
    campaign: updated.rows[0] as CampaignRecord,
    recipientCount: users.rows.length,
  };
}

export async function runDueScheduledCampaigns(): Promise<Array<{ campaignId: number; recipientCount: number }>> {
  const due = await pool.query(
    `SELECT id
     FROM campaigns
     WHERE status = 'scheduled'
       AND scheduled_send_at <= NOW()
     ORDER BY scheduled_send_at ASC`
  );

  const results: Array<{ campaignId: number; recipientCount: number }> = [];
  for (const row of due.rows) {
    const sent = await sendCampaignNow(row.id as number);
    results.push({ campaignId: sent.campaign.id, recipientCount: sent.recipientCount });
  }

  return results;
}
