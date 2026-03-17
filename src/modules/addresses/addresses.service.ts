import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Addresses } from './entities/addresses.entity';
import { CreateAddressesDto, UpdateAddressesDto } from './dto';
import { User } from '../user/entities/user.entity';

@Injectable()
export class AddressesService {
    constructor(
        @InjectRepository(Addresses)
        private readonly addressesRepository: Repository<Addresses>,
    ) {}

    async create(userId: string, dto: CreateAddressesDto): Promise<Addresses> {
        if(dto.isDefault){
            await this.addressesRepository.update(
                {user: { id: userId }},
                {isDefault: false}
            );
        }

        const address = this.addressesRepository.create({...dto, user:{id: userId}});
        return this.addressesRepository.save(address);
    }

    async findAll(userId: string): Promise<Addresses[]> {
        return this.addressesRepository.find({ where: { user: { id: userId } } });
    }

    async findById(id: string, userId: string): Promise<Addresses> {
        const address = await this.addressesRepository.findOne({ 
            where: { id, user: { id: userId } } 
        });
        if (!address) {
            throw new NotFoundException('Address not found');
        }
        return address;
    }

    async getDefault(userId: string): Promise<Addresses> {
    const address = await this.addressesRepository.findOne({
        where: {
        user: { id: userId },
        isDefault: true,
        },
    });

    if (!address) {
        throw new NotFoundException('Default address not found');
    }

    return address;
    }

    async update(id: string, userId: string, dto: UpdateAddressesDto): Promise<Addresses> {
        const address = await this.findById(id, userId);
        if(dto.isDefault){
            await this.addressesRepository.update(
                {user: { id: userId }},
                {isDefault: false}
            );
        }
        Object.assign(address, dto);
        return this.addressesRepository.save(address);
    }

    async remove(id: string, userId: string): Promise<void> {
        const address = await this.findById(id, userId);
        await this.addressesRepository.remove(address);
    }
}