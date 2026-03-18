import { Controller, Get, Query } from '@nestjs/common';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
} from '@nestjs/swagger';
import { AdminService } from './admin.service';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../../common/enums';
import { UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../auth/guards/roles.guard';

@ApiTags('Admin')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'), RolesGuard)
@Roles(UserRole.ADMIN)
@Controller('admin')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('revenue')
  @ApiOperation({ summary: 'Get revenue report' })
  @ApiResponse({ status: 200, description: 'Revenue data.' })
  @ApiResponse({ status: 400, description: 'Invalid date range.' })
    async getRevenue(@Query('from') from: string, @Query('to') to: string) {
    const data = await this.adminService.getRevenue(from, to);

    return {
        success: true,
        data,
    };
  }

  @Get('stats')
  @ApiOperation({ summary: 'Get overall stats' })
  @ApiResponse({ status: 200, description: 'Stats data.' })
    async getStats() {
    const data = await this.adminService.getStats();

    return {
        success: true,
        data,
    };
  }

  @Get('top-products')
  @ApiOperation({ summary: 'Get top selling products' })
  @ApiResponse({ status: 200, description: 'Top products data.' })
  async getTopProducts() {
    const data = await this.adminService.getTopProducts();

    return {
        success: true,
        data,
    };
  }
}