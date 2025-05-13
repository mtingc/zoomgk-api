export enum SortOrder {
  ASC = 'asc',
  DESC = 'desc',
}

export enum SortField {
  CREATED_AT = 'createdAt',
  UPDATED_AT = 'updatedAt',
  NAME = 'name',
}

export interface PaginationOptions {
  sort?: SortField;
  order?: SortOrder;
  limit?: number;
  page?: number;
  search?: string;
  searchFields?: string[];
  available?: boolean;
}