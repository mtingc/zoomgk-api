import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Query,
} from '@nestjs/common';
import { SortField, SortOrder } from '@common/types';

import { CreateUserDto, UpdateUserDto } from '@users/dto';
import { UsersService } from '@users/users.service';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) { }

  @Post()
  create(
    @Body() createUserDto: CreateUserDto
  ) {
    return this.usersService.create(createUserDto);
  }

  @Get()
  findAll(
    @Query('sort') sort: SortField = SortField.CREATED_AT,
    @Query('order') order: SortOrder = SortOrder.DESC,
    @Query('limit') limit: number = 10,
    @Query('page') page: number = 1,
    @Query('search') search: string = '',
    @Query('available') available?: boolean,
  ) {
    return this.usersService.findAll(sort, order, limit, page, search, available);
  }

  @Get(':id')
  findOne(
    @Param('id') id: string
  ) {
    return this.usersService.findOne(id);
  }

  @Put(':id')
  update(
    @Param('id') id: string,
    @Body() updateUserDto: UpdateUserDto
  ) {
    return this.usersService.update(id, updateUserDto);
  }

  @Put(':id/available')
  updateAvailable(
    @Param('id') id: string
  ) {
    return this.usersService.updateAvailable(id);
  }

  @Delete(':id')
  remove(
    @Param('id') id: string
  ) {
    return this.usersService.remove(id);
  }
}
