import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  UseGuards,
  Query,
  BadRequestException,
  Headers,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { ConfigService } from '@nestjs/config';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles, CurrentUser } from '../auth/decorators';
import { PaymentService } from './payment.service';
import { BanksService } from './services/banks.service';
import { VietQRService } from './services/vietqr.service';
import { CreateTransactionDto, CheckPaymentDto, WebhookPaymentDto, GenerateQRDto } from './dto';
import { UserRole } from '../../common/enums';
import { User } from '../user/entities/user.entity';

@ApiTags('Payment')
@Controller('payment')
export class PaymentController {
  constructor(
    private readonly paymentService: PaymentService,
    private readonly banksService: BanksService,
    private readonly vietQRService: VietQRService,
    private readonly configService: ConfigService,
  ) {}

  @Post('create')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a payment transaction with VietQR' })
  @ApiResponse({ status: 201, description: 'Transaction created successfully' })
  @ApiResponse({ status: 400, description: 'Invalid order or already paid' })
  @ApiResponse({ status: 404, description: 'Order not found' })
  async createTransaction(
    @CurrentUser() user: User,
    @Body() dto: CreateTransactionDto,
  ) {
    const transaction = await this.paymentService.createTransaction(
      user.id,
      dto,
    );

    return {
      success: true,
      message: 'Transaction created successfully',
      data: {
        transactionId: transaction.id,
        transactionCode: transaction.transactionCode,
        amount: transaction.amount,
        qrCodeUrl: transaction.qrCodeUrl,
        bankCode: transaction.bankCode,
        bankName: transaction.bankName,
        accountNo: transaction.accountNo,
        accountName: transaction.accountName,
        expiredAt: transaction.expiredAt,
        paymentInstructions: {
          step1: 'Open your banking app and scan the QR code',
          step2: `Transfer exactly ${transaction.amount.toLocaleString('vi-VN')} VND`,
          step3: `Payment description should contain: ${transaction.transactionCode}`,
          step4: 'After transfer, click "Check Payment" to verify',
        },
      },
    };
  }

  @Post('check')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Check payment status by transaction code' })
  @ApiResponse({ status: 200, description: 'Payment status retrieved' })
  async checkPayment(@Body() dto: CheckPaymentDto) {
    const result = await this.paymentService.checkPayment(dto.transactionCode);

    return {
      success: true,
      data: {
        status: result.status,
        message: result.message,
        transaction: result.transaction
          ? {
              id: result.transaction.id,
              transactionCode: result.transaction.transactionCode,
              amount: result.transaction.amount,
              paidAt: result.transaction.paidAt,
              bankTransactionId: result.transaction.bankTransactionId,
            }
          : null,
      },
    };
  }

  @Get('check/:transactionCode')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Check payment status by transaction code (GET)' })
  async checkPaymentGet(@Param('transactionCode') transactionCode: string) {
    const result = await this.paymentService.checkPayment(transactionCode);

    return {
      success: true,
      data: {
        status: result.status,
        message: result.message,
        transaction: result.transaction
          ? {
              id: result.transaction.id,
              transactionCode: result.transaction.transactionCode,
              amount: result.transaction.amount,
              paidAt: result.transaction.paidAt,
              bankTransactionId: result.transaction.bankTransactionId,
            }
          : null,
      },
    };
  }

  @Get('transactions')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get user transactions' })
  async getUserTransactions(@CurrentUser() user: User) {
    const transactions = await this.paymentService.getUserTransactions(user.id);

    return {
      success: true,
      data: transactions,
    };
  }

  @Get('transactions/:id')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get transaction by ID' })
  async getTransaction(@CurrentUser() user: User, @Param('id') id: string) {
    const transaction = await this.paymentService.getTransaction(id, user.id);

    return {
      success: true,
      data: transaction,
    };
  }

  @Get('order/:orderId')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get transactions for an order' })
  async getTransactionsByOrder(
    @CurrentUser() user: User,
    @Param('orderId') orderId: string,
  ) {
    const transactions = await this.paymentService.getTransactionsByOrder(
      orderId,
      user.id,
    );

    return {
      success: true,
      data: transactions,
    };
  }

  @Delete('transactions/:id')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Cancel a pending transaction' })
  async cancelTransaction(@CurrentUser() user: User, @Param('id') id: string) {
    const transaction = await this.paymentService.cancelTransaction(
      id,
      user.id,
    );

    return {
      success: true,
      message: 'Transaction cancelled successfully',
      data: transaction,
    };
  }

  // Admin endpoints
  @Post('confirm/:transactionCode')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Manually confirm a payment (Admin only)' })
  async confirmPayment(
    @Param('transactionCode') transactionCode: string,
    @Query('bankTransactionId') bankTransactionId?: string,
  ) {
    const transaction = await this.paymentService.confirmPayment(
      transactionCode,
      bankTransactionId,
    );

    return {
      success: true,
      message: 'Payment confirmed successfully',
      data: transaction,
    };
  }

  @Post('cleanup')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Cleanup expired transactions (Admin only)' })
  async cleanupExpired() {
    const count = await this.paymentService.cleanupExpiredTransactions();

    return {
      success: true,
      message: `Cleaned up ${count} expired transactions`,
    };
  }

  // QR Code API
  @Get('qrcode/:transactionCode')
  @ApiOperation({ summary: 'Get QR code URL for a transaction' })
  @ApiResponse({ status: 200, description: 'QR code URL' })
  async getQRCode(@Param('transactionCode') transactionCode: string) {
    const result = await this.paymentService.checkPayment(transactionCode);

    if (!result.transaction) {
      throw new BadRequestException('Transaction not found');
    }

    return {
      success: true,
      data: {
        transactionCode: result.transaction.transactionCode,
        qrCodeUrl: result.transaction.qrCodeUrl,
        amount: result.transaction.amount,
        bankCode: result.transaction.bankCode,
        bankName: result.transaction.bankName,
        accountNo: result.transaction.accountNo,
        accountName: result.transaction.accountName,
        status: result.transaction.status,
        expiredAt: result.transaction.expiredAt,
      },
    };
  }

  @Post('generate-qr')
  @ApiOperation({ summary: 'Generate VietQR code URL (without creating transaction)' })
  @ApiResponse({ status: 200, description: 'QR code generated' })
  async generateQR(@Body() dto: GenerateQRDto) {
    const qrData = this.vietQRService.generatePaymentQR(
      dto.amount,
      dto.description,
    );

    // If custom bank/account provided, generate custom QR
    if (dto.bankId || dto.accountNo) {
      const customQrUrl = this.vietQRService.generateQuickLink({
        bankId: dto.bankId || qrData.bankCode,
        accountNo: dto.accountNo || qrData.accountNo,
        accountName: dto.accountName,
        amount: dto.amount,
        description: dto.description,
        template: dto.template || 'compact2',
      });

      return {
        success: true,
        data: {
          qrCodeUrl: customQrUrl,
          amount: dto.amount,
          description: dto.description,
        },
      };
    }

    return {
      success: true,
      data: {
        qrCodeUrl: qrData.qrCodeUrl,
        qrDataUrl: qrData.qrDataUrl,
        bankCode: qrData.bankCode,
        bankName: qrData.bankName,
        accountNo: qrData.accountNo,
        accountName: qrData.accountName,
        amount: qrData.amount,
        description: qrData.description,
      },
    };
  }

  // Banks API
  @Get('banks')
  @ApiOperation({ summary: 'Get list of supported Vietnamese banks' })
  @ApiResponse({ status: 200, description: 'List of banks' })
  async getBanks() {
    const banks = await this.banksService.getBanks();

    return {
      success: true,
      data: banks,
    };
  }

  @Get('banks/:bankId')
  @ApiOperation({ summary: 'Get bank by BIN or code' })
  @ApiResponse({ status: 200, description: 'Bank details' })
  async getBank(@Param('bankId') bankId: string) {
    // Try to find by BIN first
    let bank = await this.banksService.getBankByBin(bankId);

    // If not found, try by code/shortName
    if (!bank) {
      bank = await this.banksService.getBankByCode(bankId);
    }

    if (!bank) {
      throw new BadRequestException('Bank not found');
    }

    return {
      success: true,
      data: bank,
    };
  }

  // Webhook for external payment notification (e.g., from Casso, bank webhooks)
  @Post('webhook')
  @ApiOperation({ summary: 'Webhook for payment confirmation from external services' })
  @ApiResponse({ status: 200, description: 'Payment processed' })
  async webhook(
    @Body() dto: WebhookPaymentDto,
    @Headers('x-webhook-secret') webhookSecret?: string,
  ) {
    // Verify webhook secret
    const expectedSecret = this.configService.get<string>('WEBHOOK_SECRET');
    const providedSecret = dto.secret || webhookSecret;

    if (expectedSecret && providedSecret !== expectedSecret) {
      throw new BadRequestException('Invalid webhook secret');
    }

    // Find transaction by code in description
    const result = await this.paymentService.checkPayment(dto.transactionCode);

    if (result.status === 'pending' && result.transaction) {
      // Verify amount matches
      if (Math.abs(Number(result.transaction.amount) - dto.amount) < 1) {
        await this.paymentService.confirmPayment(
          dto.transactionCode,
          dto.bankTransactionId,
        );

        return {
          success: true,
          message: 'Payment confirmed',
        };
      } else {
        return {
          success: false,
          message: 'Amount mismatch',
        };
      }
    }

    return {
      success: true,
      message: `Payment status: ${result.status}`,
    };
  }
}
