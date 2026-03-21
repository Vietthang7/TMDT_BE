import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';

interface MBTransaction {
  refNo: string;
  transactionDate: string;
  creditAmount: number;
  debitAmount: number;
  description: string;
  transactionType: string;
}

interface TransactionApiResponse {
  success: boolean;
  found?: boolean;
  pin?: string;
  match_count?: number;
  transactions?: Array<{
    posting_date: string;
    transaction_date: string;
    account_no: string;
    credit_amount: string;
    debit_amount: string;
    currency: string;
    description: string;
    add_description: string;
    available_balance: string;
    beneficiary_account: string;
    ref_no: string;
    ben_account_name: string;
    bank_name: string;
    ben_account_no: string;
    transaction_type: string;
  }>;
  message?: string;
}

@Injectable()
export class MBBankService {
  private readonly logger = new Logger(MBBankService.name);
  private readonly apiUrl: string;
  private readonly accountNo: string;

  constructor(
    private readonly configService: ConfigService,
    private readonly httpService: HttpService,
  ) {
    this.apiUrl = this.configService.get<string>('MBBANK_API_URL') || 'http://localhost:8000';
    this.accountNo = this.configService.get<string>('mbbank.accountNo') || '';

    this.logger.log(`MBBank API URL: ${this.apiUrl}`);
  }

  /**
   * Format date to API format: hh-mm-ss-dd-mm-yyyy
   */
  private formatDateForApi(date: Date): string {
    const pad = (n: number) => n.toString().padStart(2, '0');
    return `${pad(date.getHours())}-${pad(date.getMinutes())}-${pad(date.getSeconds())}-${pad(date.getDate())}-${pad(date.getMonth() + 1)}-${date.getFullYear()}`;
  }

  /**
   * Check transaction by PIN/transaction code using the Python API
   */
  async findTransactionByCode(
    transactionCode: string,
    amount: number,
  ): Promise<MBTransaction | null> {
    try {
      const today = new Date();
      const fromDate = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000); // 7 days ago

      const params = new URLSearchParams({
        pin: transactionCode,
        from_date: this.formatDateForApi(fromDate),
        to_date: this.formatDateForApi(today),
      });

      const response = await firstValueFrom(
        this.httpService.get<TransactionApiResponse>(
          `${this.apiUrl}/transactions/check-pin?${params.toString()}`,
        ),
      );

      if (response.data?.success && response.data?.found && response.data?.transactions?.length) {
        const tx = response.data.transactions[0];

        // Verify amount matches
        const creditAmount = parseFloat(tx.credit_amount) || 0;
        if (Math.abs(creditAmount - amount) < 1) {
          return {
            refNo: tx.ref_no,
            transactionDate: tx.transaction_date,
            creditAmount: creditAmount,
            debitAmount: parseFloat(tx.debit_amount) || 0,
            description: tx.description,
            transactionType: tx.transaction_type,
          };
        }
      }

      return null;
    } catch (error) {
      this.logger.error('Find transaction error', error.message);
      return null;
    }
  }

  /**
   * Get transaction history from Python API
   */
  async getTransactionHistory(
    fromDate: Date,
    toDate: Date,
  ): Promise<MBTransaction[]> {
    try {
      const params = new URLSearchParams({
        from_date: this.formatDateForApi(fromDate),
        to_date: this.formatDateForApi(toDate),
      });

      const response = await firstValueFrom(
        this.httpService.get<TransactionApiResponse>(
          `${this.apiUrl}/transactions?${params.toString()}`,
        ),
      );

      if (response.data?.success && response.data?.transactions) {
        return response.data.transactions.map((tx) => ({
          refNo: tx.ref_no,
          transactionDate: tx.transaction_date,
          creditAmount: parseFloat(tx.credit_amount) || 0,
          debitAmount: parseFloat(tx.debit_amount) || 0,
          description: tx.description,
          transactionType: tx.transaction_type,
        }));
      }

      return [];
    } catch (error) {
      this.logger.error('Get transaction history error', error.message);
      return [];
    }
  }

  isConfigured(): boolean {
    return !!this.apiUrl;
  }
}
