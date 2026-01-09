export interface OctoparseDataRow {
  [key: string]: string | number | null;
}

export interface OctoparseDataResponse {
  data: {
    total: number;
    rows: OctoparseDataRow[];
  };
  requestId: string;
}
