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

import { RolesService } from '@roles/roles.service';
import { CreateRoleDto, UpdateRoleDto } from '@roles/dto';

@Controller('roles')
export class RolesController {
  constructor(private readonly rolesService: RolesService) { }

  @Post()
  create(
    @Body() createRoleDto: CreateRoleDto
  ) {
    return this.rolesService.create(createRoleDto);
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
    return this.rolesService.findAll(sort, order, limit, page, search, available);
  }

  @Get(':id')
  findOne(
    @Param('id') id: string
  ) {
    return this.rolesService.findOne(id);
  }

  @Put(':id')
  update(
    @Param('id') id: string,
    @Body() updateRoleDto: UpdateRoleDto
  ) {
    return this.rolesService.update(id, updateRoleDto);
  }

  @Put(':id/available')
  updateAvailable(
    @Param('id') id: string
  ) {
    return this.rolesService.updateAvailable(id);
  }

  @Delete(':id')
  remove(
    @Param('id') id: string
  ) {
    return this.rolesService.remove(id);
  }
}
