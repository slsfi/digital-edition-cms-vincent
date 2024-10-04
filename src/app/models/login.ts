export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  access_token: string;
  msg: string;
  refresh_token: string;
  user_projects: string[];
}

export interface RefreshTokenResponse {
  msg: string;
  access_token: string;
}
