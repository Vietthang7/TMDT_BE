import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { In, Repository } from "typeorm";
import { Order } from "../order/entities/order.entity";
import { User } from "../user/entities/user.entity";
import { OrderItem } from "../order/entities/order-item.entity";

@Injectable()
export class AdminService {
    constructor(
        @InjectRepository(User)
        private readonly userRepository: Repository<User>,
        @InjectRepository(Order)
        private readonly orderRepository: Repository<Order>,
        @InjectRepository(OrderItem)
        private readonly orderItemRepository: Repository<OrderItem>
    ) {}

    async getRevenue(from?: string, to?: string) {
        const query = this.orderRepository
            .createQueryBuilder("o")
            .select("SUM(o.totalAmount)", "revenue")
            .where("o.status = :status", { status: "delivered" });

        if (from) {
            query.andWhere("o.createdAt >= :from", { from });
        }
        if (to) {
            query.andWhere("o.createdAt <= :to", { to });
        }

        const result = await query.getRawOne();
        return result.revenue || 0;
    }

    async getStats(from?: string, to?: string) {
        const totalOrder = await this.orderRepository.count();
        const totalUser = await this.userRepository.count();

        return{
            totalOrder,
            totalUser,
        }
    }
    
    async getTopProducts() {
        return this.orderItemRepository
        .createQueryBuilder('item')
        .leftJoin('item.product', 'product')
        .select('product.id', 'productId')
        .addSelect('product.name', 'name')
        .addSelect('SUM(item.quantity)', 'totalsold')
        .groupBy('product.id')
        .addGroupBy('product.name')
        .orderBy("totalsold", 'DESC')
        .limit(5)
        .getRawMany();
    }
}