import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Req,
  Query,
  UseGuards,
  ParseUUIDPipe,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiQuery,
} from '@nestjs/swagger';
import { Request } from 'express';
import { AddressesService } from './addresses.service';
import { CreateAddressesDto, UpdateAddressesDto } from './dto';
import { Roles } from '../auth/decorators/roles.decorator';
import { RolesGuard } from '../auth/guards/roles.guard';
import { UserRole } from '../../common/enums';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { get } from 'https';

@ApiTags('Addresses')
@Controller('addresses')
export class AddressesController {
    constructor(private readonly addressesService: AddressesService) {}

    @Get()
    @ApiBearerAuth()
    @UseGuards(AuthGuard('jwt'), RolesGuard)
    @ApiOperation({ summary: 'Get all addresses for the authenticated user' })
    @ApiResponse({ status: 200, description: 'List of addresses.' })
    findAll(@Req() req) {
        return this.addressesService.findAll(req.user['id']);
    }

    @Get(':id')
    @ApiBearerAuth()
    @UseGuards(AuthGuard('jwt'), RolesGuard)
    @ApiOperation({ summary: 'Get an address by ID for the authenticated user' })
    @ApiResponse({ status: 200, description: 'Address found.' })
    @ApiResponse({ status: 404, description: 'Address not found.' })
    findOne(@Param('id', ParseUUIDPipe) id: string, @Req() req) {
        return this.addressesService.findById(id, req.user['id']);
    }

    @Post()
    @ApiBearerAuth()
    @UseGuards(AuthGuard('jwt'), RolesGuard)
    @ApiOperation({ summary: 'Create a new address for the authenticated user' })
    @ApiResponse({ status: 201, description: 'Address created.' })
    create(@Body() dto: CreateAddressesDto, @Req() req) {
        return this.addressesService.create(req.user['id'], dto);
    }

    @Put(':id')
    @ApiBearerAuth()
    @UseGuards(AuthGuard('jwt'), RolesGuard)
    @ApiOperation({ summary: 'Update an address by ID for the authenticated user' })
    @ApiResponse({ status: 200, description: 'Address updated.' })
    @ApiResponse({ status: 404, description: 'Address not found.' })
    update(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateAddressesDto, @Req() req) {
        return this.addressesService.update(id, req.user['id'], dto);
    }

    @Delete(':id')
    @ApiBearerAuth()
    @UseGuards(AuthGuard('jwt'), RolesGuard)
    @ApiOperation({ summary: 'Delete an address by ID for the authenticated user' })
    @ApiResponse({ status: 200, description: 'Address deleted.' })
    @ApiResponse({ status: 404, description: 'Address not found.' })
    remove(@Param('id', ParseUUIDPipe) id: string, @Req() req) {
        return this.addressesService.remove(id, req.user['id']);
    }
}