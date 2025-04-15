export interface TokenResponse {
  data: {
    access_token: string;
    refresh_token: string;
  };
}

export interface UserProfile {
  id: string;
  phone: string;
  name: string | null;
  avatar: string | null;
  status: number;
  lastLoginAt: string | null;
  createdAt: string;
  updatedAt: string;
  roles: Role[];
}

export interface Conversation {
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
}

export interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  createdAt: string;
}

export interface ApiError {
  message: string;
  code?: string;
  status?: number;
}

export interface PaginationParams {
  page?: number;
  limit?: number;
}

export interface PaginatedResponse<T> {
  list: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface LoginRequest {
  phone: string;
  password: string;
}

export interface SmsLoginRequest {
  phone: string;
  code: string;
}

export interface RegisterRequest {
  phone: string;
  password: string;
  code: string;
  name: string;
}

export interface UpdateProfileRequest {
  name?: string;
  phone?: string;
}

export interface UpdatePasswordRequest {
  currentPassword: string;
  newPassword: string;
}

export interface ResetPasswordRequest {
  phone: string;
  code: string;
  newPassword: string;
}

export interface SendVerificationCodeRequest {
  phone: string;
}

export interface VerifyCodeRequest {
  phone: string;
  code: string;
}

export interface StreamResponse {
  data: ReadableStream<Uint8Array>;
}

export interface MessageResponse {
  id: string;
  role: "user" | "assistant";
  content: string;
  createdAt: string;
}

export interface VerificationResponse {
  message: string;
  verificationCode: string;
}

export interface ApiResponse<T> {
  success: boolean;
  code: string;
  data: T;
}

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  timestamp: string;
  isStreamed: boolean;
}

export interface ConversationDetail {
  id: string;
  title: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  messages: ChatMessage[];
  context: Record<string, any>;
}

export interface Role {
  id: string;
  name: string;
  description: string;
  createdAt: string;
  updatedAt: string;
}

export interface GetUserProfileResponse extends ApiResponse<UserProfile> {}

export interface GetMessagesResponse extends ApiResponse<ConversationDetail> {}
