import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PhysicalProfile } from './entities/physical-profile.entity';
import { UpdateProfileDto } from './dto';

@Injectable()
export class ProfileService {
  constructor(
    @InjectRepository(PhysicalProfile)
    private readonly profileRepository: Repository<PhysicalProfile>,
  ) {}

  async getProfile(userId: string): Promise<PhysicalProfile> {
    const profile = await this.profileRepository.findOne({
      where: { userId },
    });
    if (!profile) {
      throw new NotFoundException('Physical profile not found');
    }
    return profile;
  }

  async createOrUpdate(
    userId: string,
    dto: UpdateProfileDto,
  ): Promise<PhysicalProfile> {
    let profile = await this.profileRepository.findOne({
      where: { userId },
    });

    if (profile) {
      Object.assign(profile, dto);
    } else {
      profile = this.profileRepository.create({ ...dto, userId });
    }

    return this.profileRepository.save(profile);
  }
}
