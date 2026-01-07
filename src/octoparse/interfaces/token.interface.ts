export interface OctoparseTokenResponse {
  data: {
    access_token: string;
    expires_in: number;
    token_type: 'Bearer';
    refresh_token: string;
  };
  requestId: string;
}
