import { Injectable, BadRequestException } from '@nestjs/common';
import { Model } from 'mongoose';
import { SortOrder, SortField, PaginationOptions } from '@common/types';

@Injectable()
export class PaginationService {
  async paginate<T>(
    model: Model<T>,
    query: any = {},
    options: PaginationOptions = {},
  ) {
    const {
      sort = SortField.CREATED_AT,
      order = SortOrder.DESC,
      limit = 10,
      page = 1,
      search = '',
      searchFields = ['name'],
      available,
    } = options;

    if (!Object.values(SortField).includes(sort as SortField)) {
      throw new BadRequestException(`Invalid sort field. Allowed values are: ${Object.values(SortField).join(', ')}`);
    }

    if (!Object.values(SortOrder).includes(order as SortOrder)) {
      throw new BadRequestException(`Invalid order. Allowed values are: ${Object.values(SortOrder).join(', ')}`);
    }

    const searchQuery = search
      ? {
        $or: searchFields.map(field => ({
          [field]: { $regex: search, $options: 'i' },
        })),
      }
      : {};

    const availableQuery = available !== undefined ? { available } : {};

    const finalQuery = { ...query, ...searchQuery, ...availableQuery };

    const sortOptions = {};
    sortOptions[sort] = order === SortOrder.ASC ? 1 : -1;

    const [items, totalItems] = await Promise.all([
      model
        .find(finalQuery)
        .sort(sortOptions)
        .skip((page - 1) * limit)
        .limit(limit)
        .exec(),
      model.countDocuments(finalQuery),
    ]);

    const totalPages = Math.ceil(totalItems / limit);
    const currentPage = Math.min(Math.max(1, page), totalPages || 1);

    return {
      items,
      pagination: {
        totalItems,
        totalItemsPerPage: items.length,
        totalPages: totalPages || 1,
        currentPage
      },
    };
  }
} 