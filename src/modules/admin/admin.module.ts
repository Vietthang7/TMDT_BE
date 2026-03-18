import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { AdminService } from './admin.service';
import { AdminController } from './admin.controller';

import { Order } from '../order/entities/order.entity';
import { User } from '../user/entities/user.entity';
import { OrderItem } from '../order/entities/order-item.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Order, User, OrderItem]),
  ],
  controllers: [AdminController],
  providers: [AdminService],
})
export class AdminModule {}