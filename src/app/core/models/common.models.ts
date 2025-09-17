export interface PaginatedResult<T> {
    items: T[];
    totalCount: number;
    pageIndex: number;
    pageSize: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  }
  
  export interface FileUploadResult {
    fileUrl: string;
  }
  