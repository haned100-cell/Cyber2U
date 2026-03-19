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
}

export const api = new ApiClient();
