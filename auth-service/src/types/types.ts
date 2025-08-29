export interface JwtPayloadType {
  userId: number;
  username: string;
}

export interface User {
  id: number;
  firstName: string;
  lastName?: string;
  role: "USER" | "ADMIN";
  email: string;
  password: string;
  isVerified: boolean;
}

export interface RegistrationData {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
}

export interface LoginData {
  email: string;
  password: string;
}

export interface TwoFactorCodeData {
  code: string;
}

export interface PasswordResetRequestData {
  email: string;
}

export interface ResetPasswordData {
  newPassword: string;
}

export interface RefreshTokenData {
  token: string;
}

export interface VerificationTokenData {
  token: string;
}