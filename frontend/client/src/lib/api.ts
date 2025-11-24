const AUTH_EVENT = "ecochronos-auth-changed";

const devFallbackBase =
  typeof window !== "undefined" && window.location.origin.includes("5173")
    ? "http://localhost:3000/api"
    : "/api";

const API_BASE = (import.meta.env.VITE_API_BASE_URL || devFallbackBase).replace(/\/$/, "");

if (import.meta.env.DEV) {
  console.info(`[EcoChronos] API base -> ${API_BASE}`);
}

type MissionStatus = "AVAILABLE" | "ACTIVE" | "COMPLETED";

interface ApiEnvelope<T> {
  success: boolean;
  data?: T;
  error?: string;
}

interface BackendMission {
  id: string;
  title: string;
  description: string;
  type?: string | null;
  category?: string | null;
  god?: string | null;
  region?: string | null;
  corruptionLevel?: number | null;
  isCorruptionMission?: boolean | null;
  rewardAmount?: number | null;
  requirements?: Record<string, unknown> | null;
  isUnlocked: boolean;
  progress: MissionProgress | null;
}

export interface MissionProgress {
  id: string;
  status: string;
  progress: number;
  startedAt: string | null;
  completedAt: string | null;
}

export interface Mission {
  id: string;
  title: string;
  description: string;
  points: number;
  status: MissionStatus;
  category?: string | null;
  god?: string | null;
  region?: string | null;
  requirements?: Record<string, unknown> | null;
  isUnlocked: boolean;
  progress: MissionProgress | null;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterCredentials {
  email: string;
  username: string;
  password: string;
}

export interface AuthResponse {
  user: {
    id: string;
    email: string;
    username: string;
  };
  accessToken: string;
  refreshToken: string;
}

export interface UserStats {
  level: number;
  xp: number;
  xpProgress: {
    currentXP: number;
    currentLevelXP: number;
    nextLevelXP: number;
    progressPercentage: number;
  };
  totalEcoKarma: number;
  corruptionCleared: number;
  selectedGod: string | null;
  missionsCompleted: number;
  lessonsCompleted: number;
  badgesEarned: number;
}

export interface CompleteMissionData {
  description?: string;
  category?: string;
  quantity?: number;
}

export interface UserProfile {
  id: string;
  email: string;
  username: string;
  deviceId?: string | null;
  deviceInfo?: Record<string, unknown> | null;
  selectedGod: string | null;
  xp: number;
  level: number;
  totalEcoKarma: number;
  corruptionCleared: number;
  createdAt: string;
  updatedAt: string;
}

export interface Badge {
  id: string;
  name: string;
  description: string;
  code: string;
  icon?: string | null;
  rewardAmount: number;
  requirementType: string;
  requirementValue: number;
  rarity?: string | null;
  earnedAt?: string;
}

export interface Reward {
  id: string;
  userId: string;
  missionProgressId: string | null;
  amount: number;
  type: string;
  metadata?: Record<string, unknown> | null;
  issuedAt: string;
}

export interface RewardsResponse {
  rewards: Reward[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface Lesson {
  id: string;
  title: string;
  description: string;
  god?: string | null;
  order: number;
  unlocked: boolean;
  completed: boolean;
  quizScore?: number | null;
  quizAttempts: number;
}

export interface LessonDetail {
  id: string;
  title: string;
  description: string;
  content: string | Record<string, unknown>;
  god?: string | null;
  order: number;
  progress: {
    completed: boolean;
    quizScore?: number | null;
    quizAttempts: number;
  } | null;
}

export interface LessonQuizQuestion {
  id: string;
  question: string;
  options: string[];
  order?: number | null;
}

export interface LessonQuizResult {
  questionId: string;
  isCorrect: boolean;
  correctAnswer: number;
  explanation?: string | null;
}

export interface LearningProgress {
  completedLessons: number;
  totalLessons: number;
  completionPercent: number;
  averageQuizScore: number;
}

export interface God {
  id: string;
  name: string;
  description: string;
  power: string;
  color: string;
}

export interface ClaimedBadge extends Badge {}

export interface SelectedGod extends God {}

class ApiClient {
  private readonly TOKEN_KEY = "token";
  private readonly REFRESH_TOKEN_KEY = "refreshToken";

  private notifyAuthChange() {
    if (typeof window !== "undefined") {
      window.dispatchEvent(new Event(AUTH_EVENT));
    }
  }

  private getToken(): string | null {
    return localStorage.getItem(this.TOKEN_KEY);
  }

  private getRefreshToken(): string | null {
    return localStorage.getItem(this.REFRESH_TOKEN_KEY);
  }

  private setTokens(accessToken: string, refreshToken?: string): void {
    localStorage.setItem(this.TOKEN_KEY, accessToken);
    if (refreshToken) {
      localStorage.setItem(this.REFRESH_TOKEN_KEY, refreshToken);
    }
    this.notifyAuthChange();
  }

  public clearToken(): void {
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.REFRESH_TOKEN_KEY);
    this.notifyAuthChange();
  }

  public isAuthenticated(): boolean {
    return Boolean(this.getToken());
  }

  private createNonce(): string {
    return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const token = this.getToken();
    const method = (options.method || "GET").toUpperCase();
    const headers: HeadersInit = {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    };

    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    if (["POST", "PUT", "PATCH", "DELETE"].includes(method)) {
      headers["x-nonce"] = this.createNonce();
      headers["x-timestamp"] = Date.now().toString();
    }

    const normalizedEndpoint = endpoint.startsWith("/") ? endpoint : `/${endpoint}`;
    const response = await fetch(`${API_BASE}${normalizedEndpoint}`, {
      ...options,
      method,
      headers,
    });

    if (response.status === 401) {
      this.clearToken();
      throw new Error("Unauthorized");
    }

    const payload = (await response.json().catch(() => null)) as ApiEnvelope<T> | null;

    if (!response.ok || !payload) {
      const errorMessage = payload?.error || response.statusText || "Request failed";
      throw new Error(errorMessage);
    }

    if (!payload.success) {
      throw new Error(payload.error || "Request failed");
    }

    return payload.data as T;
  }

  private mapMission(mission: BackendMission): Mission {
    const status: MissionStatus =
      mission.progress?.status === "COMPLETED"
        ? "COMPLETED"
        : mission.progress
        ? "ACTIVE"
        : "AVAILABLE";

    return {
      id: mission.id,
      title: mission.title,
      description: mission.description,
      points: mission.rewardAmount ?? 0,
      status,
      category: mission.category,
      god: mission.god,
      region: mission.region,
      requirements: mission.requirements,
      isUnlocked: mission.isUnlocked,
      progress: mission.progress,
    };
  }

  async register(credentials: RegisterCredentials): Promise<AuthResponse> {
    const response = await this.request<AuthResponse>("/auth/signup", {
      method: "POST",
      body: JSON.stringify(credentials),
    });
    this.setTokens(response.accessToken, response.refreshToken);
    return response;
  }

  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    const response = await this.request<AuthResponse>("/auth/login", {
      method: "POST",
      body: JSON.stringify(credentials),
    });
    this.setTokens(response.accessToken, response.refreshToken);
    return response;
  }

  async getUserStats(): Promise<UserStats> {
    const response = await this.request<{ stats: UserStats }>("/users/stats");
    return response.stats;
  }

  async getUserProfile(): Promise<UserProfile> {
    return this.request<UserProfile>("/users/profile");
  }

  async getUserBadges(): Promise<Badge[]> {
    const response = await this.request<{ badges: Badge[] }>("/badges/user");
    return response.badges;
  }

  async getAllBadges(): Promise<Badge[]> {
    const response = await this.request<{ badges: Badge[] }>("/badges");
    return response.badges;
  }

  async getRecentRewards(limit = 6): Promise<RewardsResponse> {
    return this.request<RewardsResponse>(`/rewards?limit=${limit}`);
  }

  async getRewards(page = 1, limit = 20): Promise<RewardsResponse> {
    const search = new URLSearchParams({ page: String(page), limit: String(limit) });
    return this.request<RewardsResponse>(`/rewards?${search.toString()}`);
  }

  async getLessons(): Promise<Lesson[]> {
    const response = await this.request<{ lessons: Lesson[] }>("/learning/lessons");
    return response.lessons;
  }

  async getLesson(id: string): Promise<LessonDetail> {
    const response = await this.request<{ lesson: LessonDetail }>(`/learning/lessons/${id}`);
    return response.lesson;
  }

  async completeLesson(id: string): Promise<void> {
    await this.request(`/learning/lessons/${id}/complete`, { method: "POST" });
  }

  async getLessonQuiz(id: string): Promise<{ lessonId: string; questions: LessonQuizQuestion[] }> {
    const response = await this.request<{ quiz: { lessonId: string; questions: LessonQuizQuestion[] } }>(
      `/learning/quizzes/${id}`
    );
    return response.quiz;
  }

  async submitLessonQuiz(id: string, answers: number[]): Promise<{ score: number; passed: boolean; results: LessonQuizResult[] }> {
    return this.request<{ score: number; passed: boolean; results: LessonQuizResult[] }>(`/learning/quizzes/${id}/submit`, {
      method: "POST",
      body: JSON.stringify({ answers }),
    });
  }

  async getLearningProgress(): Promise<LearningProgress> {
    const response = await this.request<{ progress: LearningProgress }>("/learning/progress");
    return response.progress;
  }

  async listGods(): Promise<God[]> {
    const response = await this.request<{ gods: God[] }>("/gods/list");
    return response.gods;
  }

  async getSelectedGod(): Promise<SelectedGod | null> {
    const response = await this.request<{ selectedGod: SelectedGod | null }>("/gods/selected");
    return response.selectedGod;
  }

  async selectGod(godId: string, force = false): Promise<SelectedGod> {
    const response = await this.request<{ selectedGod: SelectedGod }>("/gods/select", {
      method: "POST",
      body: JSON.stringify({ god: godId, force }),
    });
    return response.selectedGod;
  }

  async claimBadge(badgeId: string): Promise<ClaimedBadge> {
    const response = await this.request<{ badge: ClaimedBadge }>(`/badges/${badgeId}/claim`, {
      method: "POST",
    });
    return response.badge;
  }

  async getMissions(): Promise<Mission[]> {
    const response = await this.request<{ missions: BackendMission[] }>("/missions?limit=100");
    return response.missions.map((mission) => this.mapMission(mission));
  }

  async startMission(id: string): Promise<void> {
    await this.request(`/missions/${id}/start`, {
      method: "POST",
    });
  }

  async completeMission(id: string, data?: CompleteMissionData): Promise<void> {
    await this.request(`/missions/${id}/complete`, {
      method: "POST",
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async updateMissionProgress(id: string, progress: number): Promise<void> {
    await this.request(`/missions/${id}/progress`, {
      method: "PATCH",
      body: JSON.stringify({ progress }),
    });
  }
}

export const api = new ApiClient();
export const authStore = {
  subscribe: (listener: () => void) => {
    if (typeof window === "undefined") {
      return () => {};
    }
    window.addEventListener(AUTH_EVENT, listener);
    return () => window.removeEventListener(AUTH_EVENT, listener);
  },
  getSnapshot: () => {
    if (typeof window === "undefined") {
      return false;
    }
    return Boolean(localStorage.getItem("token"));
  },
  getServerSnapshot: () => false,
};
export type { MissionStatus };
