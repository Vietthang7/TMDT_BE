import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export interface VietQRData {
  bankId: string;
  accountNo: string;
  accountName?: string;
  amount: number;
  description: string;
  template?: 'compact2' | 'compact' | 'qr_only' | 'print';
}

export interface VietQRResponse {
  qrCodeUrl: string;
  qrDataUrl: string;
  bankCode: string;
  bankName: string;
  accountNo: string;
  accountName: string;
  amount: number;
  description: string;
}

@Injectable()
export class VietQRService {
  private readonly bankCode: string;
  private readonly accountNo: string;
  private readonly accountName: string;

  // Bank mapping for VietQR
  private readonly bankMapping: Record<string, { bin: string; name: string }> = {
    '970422': { bin: '970422', name: 'MB Bank' },
    'MB': { bin: '970422', name: 'MB Bank' },
    'MBBank': { bin: '970422', name: 'MB Bank' },
    '970415': { bin: '970415', name: 'VietinBank' },
    'ICB': { bin: '970415', name: 'VietinBank' },
    'Vietinbank': { bin: '970415', name: 'VietinBank' },
    '970436': { bin: '970436', name: 'Vietcombank' },
    'VCB': { bin: '970436', name: 'Vietcombank' },
    '970418': { bin: '970418', name: 'BIDV' },
    'BIDV': { bin: '970418', name: 'BIDV' },
    '970407': { bin: '970407', name: 'Techcombank' },
    'TCB': { bin: '970407', name: 'Techcombank' },
    '970416': { bin: '970416', name: 'ACB' },
    'ACB': { bin: '970416', name: 'ACB' },
    '970432': { bin: '970432', name: 'VPBank' },
    'VPB': { bin: '970432', name: 'VPBank' },
    '970423': { bin: '970423', name: 'TPBank' },
    'TPB': { bin: '970423', name: 'TPBank' },
  };

  constructor(private readonly configService: ConfigService) {
    this.bankCode = this.configService.get<string>('mbbank.bankCode') || '970422';
    this.accountNo = this.configService.get<string>('mbbank.accountNo') || '';
    this.accountName = this.configService.get<string>('mbbank.accountName') || '';

    // Debug: log config values
    console.log('VietQR Config:', {
      bankCode: this.bankCode,
      accountNo: this.accountNo,
      accountName: this.accountName,
    });
  }

  /**
   * Generate VietQR Quick Link URL
   * Format: https://img.vietqr.io/image/<BANK_ID>-<ACCOUNT_NO>-<TEMPLATE>.png?amount=<AMOUNT>&addInfo=<DESCRIPTION>&accountName=<ACCOUNT_NAME>
   */
  generateQuickLink(data: VietQRData): string {
    const template = data.template || 'compact2';
    const bankId = this.getBankBin(data.bankId);

    // URL encode the description - remove special characters for VietQR compatibility
    const sanitizedDescription = this.sanitizeDescription(data.description);

    const params = new URLSearchParams();
    params.append('amount', data.amount.toString());
    params.append('addInfo', sanitizedDescription);

    if (data.accountName) {
      params.append('accountName', data.accountName);
    }

    return `https://img.vietqr.io/image/${bankId}-${data.accountNo}-${template}.png?${params.toString()}`;
  }

  /**
   * Generate VietQR for payment
   */
  generatePaymentQR(
    amount: number,
    transactionCode: string,
    orderInfo?: string,
  ): VietQRResponse {
    // Create description with transaction code for matching
    const description = transactionCode;

    const qrData: VietQRData = {
      bankId: this.bankCode,
      accountNo: this.accountNo,
      accountName: this.accountName,
      amount,
      description,
      template: 'compact2',
    };

    const qrCodeUrl = this.generateQuickLink(qrData);

    return {
      qrCodeUrl,
      qrDataUrl: this.generateQRDataUrl(qrData),
      bankCode: this.bankCode,
      bankName: this.getBankName(this.bankCode),
      accountNo: this.accountNo,
      accountName: this.accountName,
      amount,
      description,
    };
  }

  /**
   * Generate VietQR data URL for embedding
   */
  private generateQRDataUrl(data: VietQRData): string {
    const bankId = this.getBankBin(data.bankId);
    const sanitizedDescription = this.sanitizeDescription(data.description);

    const params = new URLSearchParams();
    params.append('amount', data.amount.toString());
    params.append('addInfo', sanitizedDescription);

    if (data.accountName) {
      params.append('accountName', data.accountName);
    }

    return `https://img.vietqr.io/image/${bankId}-${data.accountNo}-qr_only.png?${params.toString()}`;
  }

  /**
   * Get bank BIN from bank code/name
   */
  private getBankBin(bankId: string): string {
    const bank = this.bankMapping[bankId];
    return bank?.bin || bankId;
  }

  /**
   * Get bank name from bank code
   */
  private getBankName(bankId: string): string {
    const bank = this.bankMapping[bankId];
    return bank?.name || 'Unknown Bank';
  }

  /**
   * Sanitize description for VietQR (max 50 chars, no special characters)
   */
  private sanitizeDescription(description: string): string {
    return description
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // Remove diacritics
      .replace(/[^a-zA-Z0-9\s]/g, '') // Remove special characters
      .substring(0, 50)
      .trim();
  }
}
