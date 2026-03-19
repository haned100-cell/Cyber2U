import { pool } from '../db';

export interface AnalyticsSummary {
  openRate: number;
  clickThroughRate: number;
  quizParticipation: number;
  averageScore: number;
  scoreImprovement: number;
  listGrowth: number;
  totalUsers: number;
  totalCampaignsSent: number;
}

export interface CampaignAnalyticsDetails {
  campaignId: number;
  title: string;
  status: string;
  deliveredCount: number;
  openedCount: number;
  clickedCount: number;
  unsubscribedCount: number;
  bounceCount: number;
  openRate: number;
  clickThroughRate: number;
}

export interface QuarterlyReport {
  period: {
    year: number;
    quarter: number;
    startDate: string;
    endDate: string;
  };
  objective1: {
    openRate: number;
    clickThroughRate: number;
    listGrowth: number;
  };
  objective2: {
    averageScore: number;
    quizParticipation: number;
    scoreImprovement: number;
  };
  objective3: {
    campaignsSent: number;
    totalRecipients: number;
    averageOpenRate: number;
  };
}

function roundToTwo(value: number): number {
  return Math.round(value * 100) / 100;
}

function quarterRange(year: number, quarter: number): { startDate: Date; endDate: Date } {
  const safeQuarter = Math.min(Math.max(quarter, 1), 4);
  const startMonth = (safeQuarter - 1) * 3;
  const startDate = new Date(Date.UTC(year, startMonth, 1, 0, 0, 0));
  const endDate = new Date(Date.UTC(year, startMonth + 3, 0, 23, 59, 59));

  return { startDate, endDate };
}

export async function recalculateCampaignAnalytics(campaignId: number): Promise<CampaignAnalyticsDetails> {
  const campaignResult = await pool.query(
    `SELECT id, title, status
     FROM campaigns
     WHERE id = $1`,
    [campaignId]
  );

  if (campaignResult.rows.length === 0) {
    throw new Error('Campaign not found');
  }

  const campaign = campaignResult.rows[0];

  const delivery = await pool.query(
    `SELECT
       COUNT(*)::int AS delivered_count,
       COUNT(opened_at)::int AS opened_count,
       COUNT(clicked_at)::int AS clicked_count,
       COUNT(unsubscribed_at)::int AS unsubscribed_count,
       COUNT(*) FILTER (WHERE bounced = true)::int AS bounce_count
     FROM campaign_deliveries
     WHERE campaign_id = $1`,
    [campaignId]
  );

  const d = delivery.rows[0];
  const deliveredCount = d.delivered_count as number;
  const openedCount = d.opened_count as number;
  const clickedCount = d.clicked_count as number;
  const unsubscribedCount = d.unsubscribed_count as number;
  const bounceCount = d.bounce_count as number;

  const openRate = deliveredCount > 0 ? roundToTwo((openedCount / deliveredCount) * 100) : 0;
  const clickThroughRate = deliveredCount > 0 ? roundToTwo((clickedCount / deliveredCount) * 100) : 0;

  await pool.query(
    `INSERT INTO campaign_analytics (
       campaign_id,
       total_recipients,
       delivered_count,
       opened_count,
       clicked_count,
       unsubscribed_count,
       bounce_count,
       calculated_at,
       open_rate,
       click_through_rate
     ) VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), $8, $9)`,
    [
      campaignId,
      deliveredCount,
      deliveredCount,
      openedCount,
      clickedCount,
      unsubscribedCount,
      bounceCount,
      openRate,
      clickThroughRate,
    ]
  );

  return {
    campaignId,
    title: campaign.title,
    status: campaign.status,
    deliveredCount,
    openedCount,
    clickedCount,
    unsubscribedCount,
    bounceCount,
    openRate,
    clickThroughRate,
  };
}

export async function getCampaignAnalytics(campaignId: number): Promise<CampaignAnalyticsDetails> {
  const campaignResult = await pool.query(
    `SELECT id, title, status
     FROM campaigns
     WHERE id = $1`,
    [campaignId]
  );

  if (campaignResult.rows.length === 0) {
    throw new Error('Campaign not found');
  }

  const campaign = campaignResult.rows[0];

  const latestAnalytics = await pool.query(
    `SELECT total_recipients, delivered_count, opened_count, clicked_count,
            unsubscribed_count, bounce_count, open_rate, click_through_rate
     FROM campaign_analytics
     WHERE campaign_id = $1
     ORDER BY calculated_at DESC, id DESC
     LIMIT 1`,
    [campaignId]
  );

  if (latestAnalytics.rows.length === 0) {
    return recalculateCampaignAnalytics(campaignId);
  }

  const row = latestAnalytics.rows[0];
  return {
    campaignId,
    title: campaign.title,
    status: campaign.status,
    deliveredCount: Number(row.delivered_count || 0),
    openedCount: Number(row.opened_count || 0),
    clickedCount: Number(row.clicked_count || 0),
    unsubscribedCount: Number(row.unsubscribed_count || 0),
    bounceCount: Number(row.bounce_count || 0),
    openRate: Number(row.open_rate || 0),
    clickThroughRate: Number(row.click_through_rate || 0),
  };
}

export async function getSummaryAnalytics(): Promise<AnalyticsSummary> {
  const delivery = await pool.query(
    `SELECT
       COUNT(*)::int AS delivered_count,
       COUNT(opened_at)::int AS opened_count,
       COUNT(clicked_at)::int AS clicked_count
     FROM campaign_deliveries`
  );

  const quiz = await pool.query(
    `SELECT
       COUNT(DISTINCT user_id)::int AS participants,
       COALESCE(AVG(total_score), 0)::float AS average_score
     FROM quiz_sessions
     WHERE completed_at IS NOT NULL
       AND total_score IS NOT NULL`
  );

  const users = await pool.query('SELECT COUNT(*)::int AS total_users FROM users WHERE is_active = true');
  const campaigns = await pool.query("SELECT COUNT(*)::int AS sent_campaigns FROM campaigns WHERE status = 'sent'");

  const growth = await pool.query(
    `SELECT
       COALESCE(SUM(CASE WHEN created_at >= (NOW() - INTERVAL '30 days') THEN 1 ELSE 0 END), 0)::int AS current_window,
       COALESCE(SUM(CASE WHEN created_at >= (NOW() - INTERVAL '60 days')
                          AND created_at < (NOW() - INTERVAL '30 days') THEN 1 ELSE 0 END), 0)::int AS previous_window
     FROM users`
  );

  const improvement = await pool.query(
    `SELECT COALESCE(AVG(improvement_percentage), 0)::float AS avg_improvement
     FROM user_progress_snapshots`
  );

  const deliveredCount = Number(delivery.rows[0].delivered_count || 0);
  const openedCount = Number(delivery.rows[0].opened_count || 0);
  const clickedCount = Number(delivery.rows[0].clicked_count || 0);

  const openRate = deliveredCount > 0 ? roundToTwo((openedCount / deliveredCount) * 100) : 0;
  const clickThroughRate = deliveredCount > 0 ? roundToTwo((clickedCount / deliveredCount) * 100) : 0;

  const participants = Number(quiz.rows[0].participants || 0);
  const totalUsers = Number(users.rows[0].total_users || 0);
  const quizParticipation = totalUsers > 0 ? roundToTwo((participants / totalUsers) * 100) : 0;

  const currentWindow = Number(growth.rows[0].current_window || 0);
  const previousWindow = Number(growth.rows[0].previous_window || 0);
  const listGrowth = previousWindow > 0
    ? roundToTwo(((currentWindow - previousWindow) / previousWindow) * 100)
    : currentWindow > 0
      ? 100
      : 0;

  return {
    openRate,
    clickThroughRate,
    quizParticipation,
    averageScore: roundToTwo(Number(quiz.rows[0].average_score || 0)),
    scoreImprovement: roundToTwo(Number(improvement.rows[0].avg_improvement || 0)),
    listGrowth,
    totalUsers,
    totalCampaignsSent: Number(campaigns.rows[0].sent_campaigns || 0),
  };
}

export async function getQuarterlyReport(year: number, quarter: number): Promise<QuarterlyReport> {
  const { startDate, endDate } = quarterRange(year, quarter);

  const campaignAgg = await pool.query(
    `SELECT
       COUNT(*)::int AS campaigns_sent,
       COALESCE(SUM(delivered_count), 0)::int AS total_recipients,
       COALESCE(AVG(open_rate), 0)::float AS average_open_rate,
       COALESCE(AVG(click_through_rate), 0)::float AS average_ctr
     FROM campaign_analytics
     WHERE calculated_at >= $1
       AND calculated_at <= $2`,
    [startDate.toISOString(), endDate.toISOString()]
  );

  const usersWindow = await pool.query(
    `SELECT COUNT(*)::int AS users_created
     FROM users
     WHERE created_at >= $1
       AND created_at <= $2`,
    [startDate.toISOString(), endDate.toISOString()]
  );

  const quizAgg = await pool.query(
    `SELECT
       COUNT(DISTINCT qs.user_id)::int AS participants,
       COALESCE(AVG(qs.total_score), 0)::float AS average_score
     FROM quiz_sessions qs
     WHERE qs.completed_at IS NOT NULL
       AND qs.completed_at >= $1
       AND qs.completed_at <= $2`,
    [startDate.toISOString(), endDate.toISOString()]
  );

  const usersAtEnd = await pool.query(
    `SELECT COUNT(*)::int AS total_users
     FROM users
     WHERE is_active = true
       AND created_at <= $1`,
    [endDate.toISOString()]
  );

  const improvement = await pool.query(
    `SELECT COALESCE(AVG(improvement_percentage), 0)::float AS avg_improvement
     FROM user_progress_snapshots
     WHERE last_updated_at >= $1
       AND last_updated_at <= $2`,
    [startDate.toISOString(), endDate.toISOString()]
  );

  const participants = Number(quizAgg.rows[0].participants || 0);
  const totalUsers = Number(usersAtEnd.rows[0].total_users || 0);

  const quizParticipation = totalUsers > 0
    ? roundToTwo((participants / totalUsers) * 100)
    : 0;

  return {
    period: {
      year,
      quarter,
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
    },
    objective1: {
      openRate: roundToTwo(Number(campaignAgg.rows[0].average_open_rate || 0)),
      clickThroughRate: roundToTwo(Number(campaignAgg.rows[0].average_ctr || 0)),
      listGrowth: Number(usersWindow.rows[0].users_created || 0),
    },
    objective2: {
      averageScore: roundToTwo(Number(quizAgg.rows[0].average_score || 0)),
      quizParticipation,
      scoreImprovement: roundToTwo(Number(improvement.rows[0].avg_improvement || 0)),
    },
    objective3: {
      campaignsSent: Number(campaignAgg.rows[0].campaigns_sent || 0),
      totalRecipients: Number(campaignAgg.rows[0].total_recipients || 0),
      averageOpenRate: roundToTwo(Number(campaignAgg.rows[0].average_open_rate || 0)),
    },
  };
}
