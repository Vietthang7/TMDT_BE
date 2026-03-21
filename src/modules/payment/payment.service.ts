import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan } from 'typeorm';
import { InjectRedis } from '@nestjs-modules/ioredis';
import Redis from 'ioredis';
import { Transaction } from './entities/transaction.entity';
import { Order } from '../order/entities/order.entity';
import { CreateTransactionDto } from './dto';
import { VietQRService } from './services/vietqr.service';
import { MBBankService } from './services/mbbank.service';
import { PaymentStatus, PaymentMethod, OrderStatus } from '../../common/enums';
import { ConfigService } from '@nestjs/config';

const TRANSACTION_PREFIX = 'txn:';
const TRANSACTION_EXPIRY = 30 * 60; // 30 minutes in seconds

@Injectable()
export class PaymentService {
  private readonly logger = new Logger(PaymentService.name);

  constructor(
    @InjectRepository(Transaction)
    private readonly transactionRepository: Repository<Transaction>,
    @InjectRepository(Order)
    private readonly orderRepository: Repository<Order>,
    @InjectRedis()
    private readonly redis: Redis,
    private readonly vietQRService: VietQRService,
    private readonly mbBankService: MBBankService,
    private readonly configService: ConfigService,
  ) {}

  /**
   * Create a new payment transaction
   */
  async createTransaction(
    userId: string,
    dto: CreateTransactionDto,
  ): Promise<Transaction> {
    // Find the order
    const order = await this.orderRepository.findOne({
      where: { id: dto.orderId, userId },
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    // Check if order is already paid
    if (order.status !== OrderStatus.PENDING) {
      throw new BadRequestException('Order is not in pending status');
    }

    // Check for existing pending transaction
    const existingTransaction = await this.transactionRepository.findOne({
      where: {
        orderId: dto.orderId,
        status: PaymentStatus.PENDING,
      },
    });

    if (existingTransaction) {
      // Check if still valid
      if (new Date() < existingTransaction.expiredAt) {
        return existingTransaction;
      }
      // Mark expired transaction
      existingTransaction.status = PaymentStatus.EXPIRED;
      await this.transactionRepository.save(existingTransaction);
    }

    // Generate unique transaction code
    const transactionCode = this.generateTransactionCode();

    // Calculate expiry time (30 minutes from now)
    const expiredAt = new Date(Date.now() + TRANSACTION_EXPIRY * 1000);

    // Generate VietQR
    const qrData = this.vietQRService.generatePaymentQR(
      Number(order.totalAmount) - Number(order.discountAmount),
      transactionCode,
    );

    // Create transaction
    const transaction = this.transactionRepository.create({
      transactionCode,
      orderId: order.id,
      userId,
      amount: Number(order.totalAmount) - Number(order.discountAmount),
      paymentMethod: dto.paymentMethod || PaymentMethod.BANK_TRANSFER,
      status: PaymentStatus.PENDING,
      bankCode: qrData.bankCode,
      bankName: qrData.bankName,
      accountNo: qrData.accountNo,
      accountName: qrData.accountName,
      qrCodeUrl: qrData.qrCodeUrl,
      expiredAt,
    });

    const savedTransaction = await this.transactionRepository.save(transaction);

    // Store in Redis for quick lookup
    await this.redis.setex(
      `${TRANSACTION_PREFIX}${transactionCode}`,
      TRANSACTION_EXPIRY,
      JSON.stringify({
        id: savedTransaction.id,
        orderId: order.id,
        userId,
        amount: savedTransaction.amount,
        createdAt: new Date().toISOString(),
      }),
    );

    return savedTransaction;
  }

  /**
   * Check payment status by transaction code
   */
  async checkPayment(transactionCode: string): Promise<{
    status: PaymentStatus;
    transaction: Transaction | null;
    message: string;
  }> {
    // Find transaction
    const transaction = await this.transactionRepository.findOne({
      where: { transactionCode },
      relations: ['order'],
    });

    if (!transaction) {
      return {
        status: PaymentStatus.FAILED,
        transaction: null,
        message: 'Transaction not found',
      };
    }

    // Already completed or failed
    if (transaction.status === PaymentStatus.COMPLETED) {
      return {
        status: PaymentStatus.COMPLETED,
        transaction,
        message: 'Payment already completed',
      };
    }

    if (transaction.status === PaymentStatus.EXPIRED) {
      return {
        status: PaymentStatus.EXPIRED,
        transaction,
        message: 'Transaction has expired',
      };
    }

    // Check if expired
    if (new Date() > transaction.expiredAt) {
      transaction.status = PaymentStatus.EXPIRED;
      await this.transactionRepository.save(transaction);
      await this.redis.del(`${TRANSACTION_PREFIX}${transactionCode}`);

      return {
        status: PaymentStatus.EXPIRED,
        transaction,
        message: 'Transaction has expired',
      };
    }

    // Check bank transaction if MB Bank is configured
    if (this.mbBankService.isConfigured()) {
      const bankTx = await this.mbBankService.findTransactionByCode(
        transactionCode,
        Number(transaction.amount),
      );

      if (bankTx) {
        // Payment found - update transaction
        transaction.status = PaymentStatus.COMPLETED;
        transaction.bankTransactionId = bankTx.refNo;
        transaction.paidAt = new Date();
        await this.transactionRepository.save(transaction);

        // Update order status
        await this.orderRepository.update(transaction.orderId, {
          status: OrderStatus.CONFIRMED,
        });

        // Remove from Redis
        await this.redis.del(`${TRANSACTION_PREFIX}${transactionCode}`);

        return {
          status: PaymentStatus.COMPLETED,
          transaction,
          message: 'Payment confirmed successfully',
        };
      }
    }

    return {
      status: PaymentStatus.PENDING,
      transaction,
      message: 'Payment is still pending',
    };
  }

  /**
   * Get transaction by ID
   */
  async getTransaction(id: string, userId: string): Promise<Transaction> {
    const transaction = await this.transactionRepository.findOne({
      where: { id, userId },
      relations: ['order'],
    });

    if (!transaction) {
      throw new NotFoundException('Transaction not found');
    }

    return transaction;
  }

  /**
   * Get transactions by order ID
   */
  async getTransactionsByOrder(
    orderId: string,
    userId: string,
  ): Promise<Transaction[]> {
    return this.transactionRepository.find({
      where: { orderId, userId },
      order: { createdAt: 'DESC' },
    });
  }

  /**
   * Get user's transactions
   */
  async getUserTransactions(userId: string): Promise<Transaction[]> {
    return this.transactionRepository.find({
      where: { userId },
      relations: ['order'],
      order: { createdAt: 'DESC' },
    });
  }

  /**
   * Cancel a pending transaction
   */
  async cancelTransaction(id: string, userId: string): Promise<Transaction> {
    const transaction = await this.transactionRepository.findOne({
      where: { id, userId },
    });

    if (!transaction) {
      throw new NotFoundException('Transaction not found');
    }

    if (transaction.status !== PaymentStatus.PENDING) {
      throw new BadRequestException('Can only cancel pending transactions');
    }

    transaction.status = PaymentStatus.CANCELLED;
    await this.transactionRepository.save(transaction);

    // Remove from Redis
    await this.redis.del(`${TRANSACTION_PREFIX}${transaction.transactionCode}`);

    return transaction;
  }

  /**
   * Webhook to confirm payment (for manual confirmation or third-party webhooks)
   */
  async confirmPayment(
    transactionCode: string,
    bankTransactionId?: string,
  ): Promise<Transaction> {
    const transaction = await this.transactionRepository.findOne({
      where: { transactionCode },
    });

    if (!transaction) {
      throw new NotFoundException('Transaction not found');
    }

    if (transaction.status === PaymentStatus.COMPLETED) {
      throw new ConflictException('Payment already completed');
    }

    transaction.status = PaymentStatus.COMPLETED;
    transaction.paidAt = new Date();
    if (bankTransactionId) {
      transaction.bankTransactionId = bankTransactionId;
    }

    await this.transactionRepository.save(transaction);

    // Update order status
    await this.orderRepository.update(transaction.orderId, {
      status: OrderStatus.CONFIRMED,
    });

    // Remove from Redis
    await this.redis.del(`${TRANSACTION_PREFIX}${transactionCode}`);

    return transaction;
  }

  /**
   * Generate unique transaction code (exactly 15 characters for MB Bank API)
   * Format: TMDT + 5 random + 6 timestamp = 15 chars
   */
  private generateTransactionCode(): string {
    const timestamp = Date.now().toString(36).toUpperCase().slice(-6);
    const random = Math.random().toString(36).substring(2, 7).toUpperCase();
    return `TMDT${random}${timestamp}`;
  }

  /**
   * Cleanup expired transactions (can be called by a cron job)
   */
  async cleanupExpiredTransactions(): Promise<number> {
    const result = await this.transactionRepository.update(
      {
        status: PaymentStatus.PENDING,
        expiredAt: LessThan(new Date()),
      },
      { status: PaymentStatus.EXPIRED },
    );

    return result.affected || 0;
  }
}
