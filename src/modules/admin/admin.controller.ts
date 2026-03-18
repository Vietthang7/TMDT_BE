import { Controller, Get, Query } from '@nestjs/common';
import { AdminService } from './admin.service';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../../common/enums';
import { UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../auth/guards/roles.guard';

@Controller('admin')
@UseGuards(AuthGuard('jwt'), RolesGuard)
@Roles(UserRole.ADMIN)
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('revenue')
    async getRevenue(@Query('from') from: string, @Query('to') to: string) {
    const data = await this.adminService.getRevenue(from, to);

    return {
        success: true,
        data,
    };
  }

  @Get('stats')
    async getStats() {
    const data = await this.adminService.getStats();

    return {
        success: true,
        data,
    };
  }

  @Get('top-products')
  async getTopProducts() {
    const data = await this.adminService.getTopProducts();

    return {
        success: true,
        data,
    };
  }
}