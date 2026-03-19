import axios, { AxiosInstance } from 'axios';

interface AuthResponse {
  token: string;
  userId: number;
  email: string;
}

interface ProgressData {
  totalQuizzesCompleted: number;
  averageScore: number;
  improvementPercentage: number;
  topicScores: Record<string, number>;
}

export interface CampaignPayload {
  title: string;
  description?: string;
  campaignType: string;
  subjectLine?: string;
  emailBodyHtml?: string;
  emailBodyText?: string;
  caseStudyContent?: string;
}

export interface Campaign {
  id: number;
  title: string;
  description: string | null;
  campaign_type: string;
  status: 'draft' | 'review' | 'approved' | 'scheduled' | 'sent' | 'archived';
  scheduled_send_at: string | null;
}

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

class ApiClient {
  private client: AxiosInstance;

  constructor(baseURL: string = '/api') {
    this.client = axios.create({
      baseURL,
      withCredentials: true,
    });

    // Add token to all requests if available
    this.client.interceptors.request.use((config) => {
      const token = localStorage.getItem('authToken');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    });
  }

  // Auth
  async requestMagicLink(email: string): Promise<void> {
    await this.client.post('/auth/request-magic-link', { email });
  }

  async verifyMagicLink(token: string): Promise<AuthResponse> {
    const response = await this.client.post<AuthResponse>('/auth/verify', { token });
    localStorage.setItem('authToken', response.data.token);
    return response.data;
  }

  async logout(): Promise<void> {
    await this.client.post('/auth/logout');
    localStorage.removeItem('authToken');
  }

  // Progress
  async getProgress(): Promise<ProgressData> {
    const response = await this.client.get<ProgressData>('/progress');
    return response.data;
  }

  // Quiz
  async getWeeklyQuiz() {
    const response = await this.client.get('/quiz/weekly');
    return response.data;
  }

  async submitQuizAnswers(sessionId: number, answers: Record<number, number>) {
    const response = await this.client.post(`/quiz/${sessionId}/submit`, { answers });
    return response.data;
  }

  // Campaigns
  async listCampaigns(status?: string): Promise<Campaign[]> {
    const response = await this.client.get<{ campaigns: Campaign[] }>('/campaigns', {
      params: status ? { status } : undefined,
    });
    return response.data.campaigns;
  }

  async createCampaign(payload: CampaignPayload): Promise<Campaign> {
    const response = await this.client.post<{ campaign: Campaign }>('/campaigns', payload);
    return response.data.campaign;
  }

  async updateCampaign(id: number, payload: Partial<CampaignPayload>): Promise<Campaign> {
    const response = await this.client.put<{ campaign: Campaign }>(`/campaigns/${id}`, payload);
    return response.data.campaign;
  }

  async submitCampaignForReview(id: number): Promise<Campaign> {
    const response = await this.client.post<{ campaign: Campaign }>(`/campaigns/${id}/submit-review`);
    return response.data.campaign;
  }

  async approveCampaign(id: number, reviewNotes?: string): Promise<Campaign> {
    const response = await this.client.post<{ campaign: Campaign }>(`/campaigns/${id}/approve`, {
      reviewNotes,
    });
    return response.data.campaign;
  }

  async scheduleCampaign(id: number, scheduledSendAt: string): Promise<Campaign> {
    const response = await this.client.post<{ campaign: Campaign }>(`/campaigns/${id}/schedule`, {
      scheduledSendAt,
    });
    return response.data.campaign;
  }

  async sendCampaignNow(id: number): Promise<{ campaign: Campaign; recipientCount: number }> {
    const response = await this.client.post<{ campaign: Campaign; recipientCount: number }>(`/campaigns/${id}/send-now`);
    return response.data;
  }

  async runScheduledCampaigns(): Promise<{ processed: number }> {
    const response = await this.client.post<{ processed: number }>('/campaigns/run-scheduled');
    return response.data;
  }

  // Analytics
  async getAnalyticsSummary(): Promise<AnalyticsSummary> {
    const response = await this.client.get<{ summary: AnalyticsSummary }>('/analytics/summary');
    return response.data.summary;
  }

  async getCampaignAnalytics(campaignId: number): Promise<{
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
  }> {
    const response = await this.client.get(`/analytics/campaigns/${campaignId}`);
    return response.data.campaign;
  }

  async recalculateCampaignAnalytics(campaignId: number): Promise<void> {
    await this.client.post(`/analytics/campaigns/${campaignId}/recalculate`);
  }

  async getQuarterlyReport(year: number, quarter: number): Promise<QuarterlyReport> {
    const response = await this.client.get<{ report: QuarterlyReport }>('/analytics/quarterly-report', {
      params: { year, quarter },
    });
    return response.data.report;
  }
}

export const api = new ApiClient();
