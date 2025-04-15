import axios from "axios";
import {
  TokenResponse,
  UserProfile,
  Conversation,
  Message,
  LoginRequest,
  SmsLoginRequest,
  RegisterRequest,
  UpdateProfileRequest,
  UpdatePasswordRequest,
  ResetPasswordRequest,
  SendVerificationCodeRequest,
  VerifyCodeRequest,
  PaginatedResponse,
  StreamResponse,
  MessageResponse,
  VerificationResponse,
  PaginationParams,
  GetMessagesResponse,
  ApiResponse,
  ConversationDetail,
  GetUserProfileResponse,
} from "@/types/api";

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000",
});

// Add token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Add response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Handle token refresh
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      try {
        const refreshToken = localStorage.getItem("refresh_token");
        if (refreshToken) {
          const response = await api.post<TokenResponse>(
            "/auth/token/refresh",
            {
              refresh_token: refreshToken,
            }
          );
          const { access_token, refresh_token } = response.data.data;
          localStorage.setItem("token", access_token);
          localStorage.setItem("refresh_token", refresh_token);
          originalRequest.headers.Authorization = `Bearer ${access_token}`;
          return api(originalRequest);
        }
      } catch (refreshError) {
        // If refresh token fails, redirect to login
        localStorage.removeItem("token");
        localStorage.removeItem("refresh_token");
        window.location.href = "/login";
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

// Auth API
export const authApi = {
  login: (data: LoginRequest) =>
    api.post<TokenResponse>("/auth/login", data).then((res) => res.data),

  loginWithSms: (data: SmsLoginRequest) =>
    api.post<TokenResponse>("/auth/login/sms", data).then((res) => res.data),

  register: (data: RegisterRequest) =>
    api
      .post<{ data: TokenResponse }>("/auth/register", data)
      .then((res) => res.data),

  getProfile: () =>
    api.get<UserProfile>("/auth/profile").then((res) => res.data),

  updateProfile: (data: UpdateProfileRequest) =>
    api.put<UserProfile>("/auth/profile", data).then((res) => res.data),

  updatePassword: (data: UpdatePasswordRequest) =>
    api.put<MessageResponse>("/auth/password", data).then((res) => res.data),

  sendVerificationCode: (data: SendVerificationCodeRequest) =>
    api
      .post<{ data: VerificationResponse }>("/auth/sms/send", data)
      .then((res) => res.data),

  verifyCode: (data: VerifyCodeRequest) =>
    api.post<MessageResponse>("/auth/sms/verify", data).then((res) => res.data),

  refreshToken: (refreshToken: string) =>
    api
      .post<TokenResponse>("/auth/token/refresh", {
        refresh_token: refreshToken,
      })
      .then((res) => res.data),

  logout: () =>
    api.post<MessageResponse>("/auth/logout").then((res) => res.data),

  resetPassword: (data: ResetPasswordRequest) =>
    api
      .post<MessageResponse>("/auth/forgot-password", data)
      .then((res) => res.data),

  getUserProfile: () =>
    api.get<GetUserProfileResponse>("/auth/profile").then((res) => res.data),
};

// Conversation API
export const conversationApi = {
  getConversations: (params?: {
    page?: number;
    limit?: number;
    title?: string;
  }) =>
    api
      .post<{ data: PaginatedResponse<Conversation> }>(
        "/conversations/pagination",
        params
      )
      .then((res) => res.data),

  createConversation: (title: string, context: string) =>
    api
      .post<{ data: Conversation }>("/conversations", { title, context })
      .then((res) => res.data.data),

  getConversation: (id: string) =>
    api.get<Conversation>(`/conversations/${id}`).then((res) => res.data),

  updateConversation: (id: string, data: Partial<Conversation>) =>
    api.put<Conversation>(`/conversations/${id}`, data).then((res) => res.data),

  deleteConversation: (id: string) =>
    api.delete(`/conversations/${id}`).then((res) => res.data),

  sendMessage: (id: string, message: string) =>
    api
      .get<StreamResponse>(`/conversations/${id}/message`, {
        params: { message },
      })
      .then((res) => res.data),

  getMessages: async (id: string): Promise<GetMessagesResponse> =>
    api
      .get<GetMessagesResponse>(`/conversations/${id}/messages`)
      .then((res) => res.data),
};
