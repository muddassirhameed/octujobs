export interface OctoparseTokenResponse {
  data: {
    access_token: string;
    expires_in: number | string;
    token_type: 'Bearer';
    refresh_token: string;
  };
  requestId: string;
}
