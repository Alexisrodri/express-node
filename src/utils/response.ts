export interface ApiResponse<T = any> {
  status: boolean;
  data?: T;
  message?: string;
  errors?: any[];
  pagination?: {
    page: number;
    pageSize: number;
    totalItems: number;
    totalPages: number;
  };
}

export function successResponse<T>(data: T, message?: string): ApiResponse<T> {
  return {
    status: true,
    data,
    message,
  };
}

export function errorResponse(message: string, errors?: any[]): ApiResponse {
  return {
    status: false,
    message,
    errors,
  };
}

export function paginatedResponse<T>(
  data: T[],
  page: number,
  pageSize: number,
  totalItems: number,
  message?: string
): ApiResponse<T[]> {
  return {
    status: true,
    data,
    message,
    pagination: {
      page,
      pageSize,
      totalItems,
      totalPages: Math.ceil(totalItems / pageSize),
    },
  };
}

