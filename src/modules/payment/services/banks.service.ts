import { Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';

export interface Bank {
  id: number;
  name: string;
  code: string;
  bin: string;
  shortName: string;
  logo: string;
  transferSupported: number;
  lookupSupported: number;
  swiftCode: string;
}

@Injectable()
export class BanksService {
  private cachedBanks: Bank[] = [];
  private lastFetch: number = 0;
  private readonly CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours

  // Fallback list of common Vietnamese banks
  private readonly fallbackBanks: Bank[] = [
    {
      id: 17,
      name: 'Ngân hàng TMCP Quân đội',
      code: 'MB',
      bin: '970422',
      shortName: 'MBBank',
      logo: 'https://api.vietqr.io/img/MB.png',
      transferSupported: 1,
      lookupSupported: 1,
      swiftCode: 'MSCBVNVX',
    },
    {
      id: 43,
      name: 'Ngân hàng TMCP Ngoại Thương Việt Nam',
      code: 'VCB',
      bin: '970436',
      shortName: 'Vietcombank',
      logo: 'https://api.vietqr.io/img/VCB.png',
      transferSupported: 1,
      lookupSupported: 1,
      swiftCode: 'BFTVVNVX',
    },
    {
      id: 42,
      name: 'Ngân hàng TMCP Công Thương Việt Nam',
      code: 'ICB',
      bin: '970415',
      shortName: 'VietinBank',
      logo: 'https://api.vietqr.io/img/ICB.png',
      transferSupported: 1,
      lookupSupported: 1,
      swiftCode: 'ICBVVNVX',
    },
    {
      id: 34,
      name: 'Ngân hàng TMCP Đầu tư và Phát triển Việt Nam',
      code: 'BIDV',
      bin: '970418',
      shortName: 'BIDV',
      logo: 'https://api.vietqr.io/img/BIDV.png',
      transferSupported: 1,
      lookupSupported: 1,
      swiftCode: 'BIDVVNVX',
    },
    {
      id: 2,
      name: 'Ngân hàng TMCP Á Châu',
      code: 'ACB',
      bin: '970416',
      shortName: 'ACB',
      logo: 'https://api.vietqr.io/img/ACB.png',
      transferSupported: 1,
      lookupSupported: 1,
      swiftCode: 'ASCBVNVX',
    },
    {
      id: 26,
      name: 'Ngân hàng TMCP Kỹ thương Việt Nam',
      code: 'TCB',
      bin: '970407',
      shortName: 'Techcombank',
      logo: 'https://api.vietqr.io/img/TCB.png',
      transferSupported: 1,
      lookupSupported: 1,
      swiftCode: 'VTCBVNVX',
    },
    {
      id: 5,
      name: 'Ngân hàng TMCP Việt Nam Thịnh Vượng',
      code: 'VPB',
      bin: '970432',
      shortName: 'VPBank',
      logo: 'https://api.vietqr.io/img/VPB.png',
      transferSupported: 1,
      lookupSupported: 1,
      swiftCode: 'VPBKVNVX',
    },
    {
      id: 22,
      name: 'Ngân hàng TMCP Tiên Phong',
      code: 'TPB',
      bin: '970423',
      shortName: 'TPBank',
      logo: 'https://api.vietqr.io/img/TPB.png',
      transferSupported: 1,
      lookupSupported: 1,
      swiftCode: 'TPBVVNVX',
    },
    {
      id: 21,
      name: 'Ngân hàng TMCP Sài Gòn Thương Tín',
      code: 'STB',
      bin: '970403',
      shortName: 'Sacombank',
      logo: 'https://api.vietqr.io/img/STB.png',
      transferSupported: 1,
      lookupSupported: 1,
      swiftCode: 'SGTTVNVX',
    },
    {
      id: 12,
      name: 'Ngân hàng TMCP Phát triển Thành phố Hồ Chí Minh',
      code: 'HDB',
      bin: '970437',
      shortName: 'HDBank',
      logo: 'https://api.vietqr.io/img/HDB.png',
      transferSupported: 1,
      lookupSupported: 1,
      swiftCode: 'HABORVNX',
    },
    {
      id: 38,
      name: 'Ngân hàng Nông nghiệp và Phát triển Nông thôn Việt Nam',
      code: 'VBA',
      bin: '970405',
      shortName: 'Agribank',
      logo: 'https://api.vietqr.io/img/VBA.png',
      transferSupported: 1,
      lookupSupported: 1,
      swiftCode: 'VBAAVNVX',
    },
    {
      id: 19,
      name: 'Ngân hàng TMCP Sài Gòn',
      code: 'SCB',
      bin: '970429',
      shortName: 'SCB',
      logo: 'https://api.vietqr.io/img/SCB.png',
      transferSupported: 1,
      lookupSupported: 1,
      swiftCode: 'SAABORVNX',
    },
    {
      id: 35,
      name: 'Ngân hàng TMCP Phương Đông',
      code: 'OCB',
      bin: '970448',
      shortName: 'OCB',
      logo: 'https://api.vietqr.io/img/OCB.png',
      transferSupported: 1,
      lookupSupported: 1,
      swiftCode: 'ORCOVNVX',
    },
    {
      id: 24,
      name: 'Ngân hàng TMCP Sài Gòn - Hà Nội',
      code: 'SHB',
      bin: '970443',
      shortName: 'SHB',
      logo: 'https://api.vietqr.io/img/SHB.png',
      transferSupported: 1,
      lookupSupported: 1,
      swiftCode: 'SHBAVNVX',
    },
    {
      id: 37,
      name: 'Ngân hàng TMCP Quốc tế Việt Nam',
      code: 'VIB',
      bin: '970441',
      shortName: 'VIB',
      logo: 'https://api.vietqr.io/img/VIB.png',
      transferSupported: 1,
      lookupSupported: 1,
      swiftCode: 'VNIBVNVX',
    },
    {
      id: 4,
      name: 'Ngân hàng TMCP Bắc Á',
      code: 'BAB',
      bin: '970409',
      shortName: 'BacABank',
      logo: 'https://api.vietqr.io/img/BAB.png',
      transferSupported: 1,
      lookupSupported: 1,
      swiftCode: 'NASCVNVX',
    },
    {
      id: 31,
      name: 'Ngân hàng TMCP Xuất Nhập khẩu Việt Nam',
      code: 'EIB',
      bin: '970431',
      shortName: 'Eximbank',
      logo: 'https://api.vietqr.io/img/EIB.png',
      transferSupported: 1,
      lookupSupported: 1,
      swiftCode: 'EBVIVNVX',
    },
    {
      id: 32,
      name: 'Ngân hàng TMCP Hàng Hải',
      code: 'MSB',
      bin: '970426',
      shortName: 'MSB',
      logo: 'https://api.vietqr.io/img/MSB.png',
      transferSupported: 1,
      lookupSupported: 1,
      swiftCode: 'MCABORVNX',
    },
    {
      id: 20,
      name: 'Ngân hàng TMCP Đông Nam Á',
      code: 'SEAB',
      bin: '970440',
      shortName: 'SeABank',
      logo: 'https://api.vietqr.io/img/SEAB.png',
      transferSupported: 1,
      lookupSupported: 1,
      swiftCode: 'SEAVVNVX',
    },
    {
      id: 33,
      name: 'Ngân hàng TMCP Nam Á',
      code: 'NAB',
      bin: '970428',
      shortName: 'NamABank',
      logo: 'https://api.vietqr.io/img/NAB.png',
      transferSupported: 1,
      lookupSupported: 1,
      swiftCode: 'NAMAVNVX',
    },
  ];

  constructor(private readonly httpService: HttpService) {}

  async getBanks(): Promise<Bank[]> {
    // Check cache
    if (
      this.cachedBanks.length > 0 &&
      Date.now() - this.lastFetch < this.CACHE_TTL
    ) {
      return this.cachedBanks;
    }

    try {
      const response = await firstValueFrom(
        this.httpService.get('https://api.vietqr.io/v2/banks'),
      );

      if (response.data?.data) {
        this.cachedBanks = response.data.data;
        this.lastFetch = Date.now();
        return this.cachedBanks;
      }
    } catch (error) {
      // Return fallback if API fails
      console.error('Failed to fetch banks from VietQR API:', error.message);
    }

    return this.fallbackBanks;
  }

  async getBankByBin(bin: string): Promise<Bank | undefined> {
    const banks = await this.getBanks();
    return banks.find((bank) => bank.bin === bin);
  }

  async getBankByCode(code: string): Promise<Bank | undefined> {
    const banks = await this.getBanks();
    return banks.find(
      (bank) =>
        bank.code.toLowerCase() === code.toLowerCase() ||
        bank.shortName.toLowerCase() === code.toLowerCase(),
    );
  }
}
