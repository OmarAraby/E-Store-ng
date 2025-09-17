export interface LoginDto {
    email: string;
    password: string;
  }
  
  export interface RegisterDto {
    username: string;
    email: string;
    password: string;
  }
  
  export interface TokenResponseDto {
    accessToken: string;
    refreshToken: string;
    expiresAt: string;
    tokenType: string;
  }
  
  export interface RefreshTokenDto {
    refreshToken: string;
  }
  
  export interface User {
    id: string;
    username: string;
    email: string;
    lastLoginTime?: string;
    roles?: string[]; // Optional roles if needed
  }
  