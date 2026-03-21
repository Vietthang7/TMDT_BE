import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HttpModule } from '@nestjs/axios';
import { PaymentController } from './payment.controller';
import { PaymentService } from './payment.service';
import { VietQRService } from './services/vietqr.service';
import { MBBankService } from './services/mbbank.service';
import { BanksService } from './services/banks.service';
import { Transaction } from './entities/transaction.entity';
import { Order } from '../order/entities/order.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Transaction, Order]),
    HttpModule.register({
      timeout: 30000,
      maxRedirects: 5,
    }),
  ],
  controllers: [PaymentController],
  providers: [PaymentService, VietQRService, MBBankService, BanksService],
  exports: [PaymentService, VietQRService, BanksService],
})
export class PaymentModule {}
