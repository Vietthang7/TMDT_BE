import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DataSeeder } from './data.seeder';
import { User } from '../../modules/user/entities/user.entity';
import { Category } from '../../modules/category/entities/category.entity';
import { Product } from '../../modules/product/entities/product.entity';
import { Cart } from '../../modules/cart/entities/cart.entity';
import { CartItem } from '../../modules/cart/entities/cart-item.entity';
import { Order } from '../../modules/order/entities/order.entity';
import { OrderItem } from '../../modules/order/entities/order-item.entity';
import { PhysicalProfile } from '../../modules/profile/entities/physical-profile.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      User,
      Category,
      Product,
      Cart,
      CartItem,
      Order,
      OrderItem,
      PhysicalProfile,
    ]),
  ],
  providers: [DataSeeder],
})
export class SeedModule {}
