export interface BaseEntityProps {
  id?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface PaginatedResult<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}

export interface ErrorResponse {
  statusCode: number;
  error: string;
  message: string;
}

/**
 * Minimal JSON Schema representation used across the project.
 * This covers only the properties currently required by the
 * connector and can be extended as needed.
 */
export interface JSONSchema {
  type: string;
  properties?: Record<string, unknown>;
  required?: string[];
  additionalProperties?: boolean | JSONSchema;
  [key: string]: unknown;
}
