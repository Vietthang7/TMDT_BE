import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { databaseConfig, jwtConfig, cloudinaryConfig } from './config';
import { AuthModule } from './modules/auth/auth.module';
import { UserModule } from './modules/user/user.module';
import { ProfileModule } from './modules/profile/profile.module';
import { ProductModule } from './modules/product/product.module';
import { CategoryModule } from './modules/category/category.module';
import { CartModule } from './modules/cart/cart.module';
import { OrderModule } from './modules/order/order.module';
import { CloudinaryModule } from './modules/cloudinary/cloudinary.module';
import { SeedModule } from './database/seeds/seed.module';

@Module({
  imports: [
    // ── Global Config ──────────────────────────────────
    ConfigModule.forRoot({
      isGlobal: true,
      load: [databaseConfig, jwtConfig, cloudinaryConfig],
      envFilePath: '.env',
    }),

    // ── Database ───────────────────────────────────────
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) =>
        configService.getOrThrow('database'),
    }),

    // ── Feature Modules ────────────────────────────────
    AuthModule,
    UserModule,
    ProfileModule,
    CategoryModule,
    ProductModule,
    CartModule,
    OrderModule,
    CloudinaryModule,
    SeedModule,
  ],
})
export class AppModule {}
