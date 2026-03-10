import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User } from '../../modules/user/entities/user.entity';
import { UserRole } from '../../common/enums';

@Injectable()
export class AdminSeeder implements OnModuleInit {
  private readonly logger = new Logger(AdminSeeder.name);

  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly configService: ConfigService,
  ) {}

  async onModuleInit(): Promise<void> {
    await this.seedAdmin();
  }

  private async seedAdmin(): Promise<void> {
    const adminEmail = this.configService.get<string>(
      'ADMIN_EMAIL',
      'admin@fitness.com',
    );

    const existing = await this.userRepository.findOne({
      where: { email: adminEmail },
    });

    if (existing) {
      this.logger.log(`Admin account already exists: ${adminEmail}`);
      return;
    }

    const adminPassword = this.configService.get<string>(
      'ADMIN_PASSWORD',
      'Admin@123456',
    );
    const hashedPassword = await bcrypt.hash(adminPassword, 10);

    const admin = this.userRepository.create({
      email: adminEmail,
      password: hashedPassword,
      firstName: 'System',
      lastName: 'Admin',
      role: UserRole.ADMIN,
    });

    await this.userRepository.save(admin);
    this.logger.log(`Default admin account created: ${adminEmail}`);
  }
}
