import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User } from '../../modules/user/entities/user.entity';
import { Category } from '../../modules/category/entities/category.entity';
import { Product } from '../../modules/product/entities/product.entity';
import { Cart } from '../../modules/cart/entities/cart.entity';
import { CartItem } from '../../modules/cart/entities/cart-item.entity';
import { Order } from '../../modules/order/entities/order.entity';
import { OrderItem } from '../../modules/order/entities/order-item.entity';
import { PhysicalProfile } from '../../modules/profile/entities/physical-profile.entity';
import { Coupon } from '../../modules/coupon/entities/coupon.entity';
import { UserRole, FitnessGoal, OrderStatus, DiscountType } from '../../common/enums';
import { Addresses } from '../../modules/addresses/entities/addresses.entity';

@Injectable()
export class DataSeeder implements OnModuleInit {
  private readonly logger = new Logger(DataSeeder.name);

  constructor(
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    @InjectRepository(Category)
    private readonly categoryRepo: Repository<Category>,
    @InjectRepository(Product)
    private readonly productRepo: Repository<Product>,
    @InjectRepository(Cart)
    private readonly cartRepo: Repository<Cart>,
    @InjectRepository(CartItem)
    private readonly cartItemRepo: Repository<CartItem>,
    @InjectRepository(Order)
    private readonly orderRepo: Repository<Order>,
    @InjectRepository(OrderItem)
    private readonly orderItemRepo: Repository<OrderItem>,
    @InjectRepository(PhysicalProfile)
    private readonly profileRepo: Repository<PhysicalProfile>,
    @InjectRepository(Coupon)
    private readonly couponRepo: Repository<Coupon>,
    @InjectRepository(Addresses)
    private readonly addressesRepo: Repository<Addresses>,
  ) {}

  async onModuleInit(): Promise<void> {
    const productCount = await this.productRepo.count();
    if (productCount > 0) {
      this.logger.log('Data already seeded, skipping...');
      await this.seedCouponsIfNeeded();
      return;
    }
    await this.seed();
  }

  private async seedCouponsIfNeeded(): Promise<void> {
    const couponCount = await this.couponRepo.count();
    if (couponCount > 0) return;

    this.logger.log('Seeding coupons...');
    const coupons = await this.couponRepo.save([
      {
        code: 'WELCOME10',
        discountType: DiscountType.PERCENTAGE,
        discountValue: 10,
        minOrderAmount: 500000,
        maxDiscountAmount: 200000,
        usageLimit: 100,
        usedCount: 12,
        startDate: new Date('2025-01-01'),
        endDate: new Date('2026-12-31'),
        isActive: true,
      },
      {
        code: 'SUMMER2024',
        discountType: DiscountType.PERCENTAGE,
        discountValue: 15,
        minOrderAmount: 1000000,
        maxDiscountAmount: 500000,
        usageLimit: 50,
        usedCount: 48,
        startDate: new Date('2024-06-01'),
        endDate: new Date('2024-08-31'),
        isActive: false,
      },
      {
        code: 'GIAM50K',
        discountType: DiscountType.FIXED_AMOUNT,
        discountValue: 50000,
        minOrderAmount: 300000,
        usageLimit: 200,
        usedCount: 85,
        startDate: new Date('2025-01-01'),
        endDate: new Date('2026-12-31'),
        isActive: true,
      },
      {
        code: 'GIAM100K',
        discountType: DiscountType.FIXED_AMOUNT,
        discountValue: 100000,
        minOrderAmount: 800000,
        usageLimit: 50,
        usedCount: 20,
        startDate: new Date('2025-06-01'),
        endDate: new Date('2026-06-30'),
        isActive: true,
      },
      {
        code: 'VIP20',
        discountType: DiscountType.PERCENTAGE,
        discountValue: 20,
        minOrderAmount: 2000000,
        maxDiscountAmount: 1000000,
        usageLimit: 0,
        usedCount: 5,
        startDate: new Date('2025-01-01'),
        endDate: new Date('2026-12-31'),
        isActive: true,
      },
      {
        code: 'FREESHIP',
        discountType: DiscountType.FIXED_AMOUNT,
        discountValue: 30000,
        minOrderAmount: 0,
        usageLimit: 500,
        usedCount: 230,
        startDate: new Date('2025-01-01'),
        endDate: new Date('2026-12-31'),
        isActive: true,
      },
    ]);
    this.logger.log(`Seeded ${coupons.length} coupons`);
  }

  private async seed(): Promise<void> {
    this.logger.log('Seeding data...');

    // ── Categories ─────────────────────────────────────
    const categories = await this.categoryRepo.save([
      {
        name: 'Whey Protein',
        description: 'Sữa whey protein tăng cơ, phục hồi sau tập luyện',
        imageUrl: 'https://placehold.co/400x300?text=Whey+Protein',
      },
      {
        name: 'Pre-Workout',
        description: 'Thực phẩm bổ sung trước tập, tăng năng lượng & sức bền',
        imageUrl: 'https://placehold.co/400x300?text=Pre-Workout',
      },
      {
        name: 'BCAA & Amino',
        description: 'Axit amin chuỗi nhánh hỗ trợ phục hồi cơ bắp',
        imageUrl: 'https://placehold.co/400x300?text=BCAA',
      },
      {
        name: 'Creatine',
        description: 'Creatine monohydrate tăng sức mạnh & hiệu suất',
        imageUrl: 'https://placehold.co/400x300?text=Creatine',
      },
      {
        name: 'Vitamin & Khoáng chất',
        description: 'Vitamin tổng hợp, omega-3, kẽm, magie...',
        imageUrl: 'https://placehold.co/400x300?text=Vitamins',
      },
      {
        name: 'Thanh Protein',
        description: 'Thanh protein tiện lợi, ăn vặt lành mạnh',
        imageUrl: 'https://placehold.co/400x300?text=Protein+Bar',
      },
      {
        name: 'Phụ kiện tập gym',
        description: 'Bao tay, đai lưng, dây kéo, shaker...',
        imageUrl: 'https://placehold.co/400x300?text=Accessories',
      },
      {
        name: 'Giảm cân',
        description: 'Fat burner, L-carnitine, CLA hỗ trợ giảm mỡ',
        imageUrl: 'https://placehold.co/400x300?text=Fat+Burner',
      },
    ]);

    this.logger.log(`Seeded ${categories.length} categories`);

    const [whey, preWorkout, bcaa, creatine, vitamin, proteinBar, accessories, fatBurner] = categories;

    // ── Products ───────────────────────────────────────
    const products = await this.productRepo.save([
      {
        name: 'Optimum Nutrition Gold Standard 100% Whey 2.27kg',
        description: 'Whey protein bán chạy nhất thế giới. 24g protein/serving, 5.5g BCAA. Hương Double Rich Chocolate.',
        price: 1590000,
        stock: 50,
        categories: [whey],
        tags: ['best-seller', 'whey', 'chocolate'],
        images: ['https://placehold.co/600x600?text=ON+Gold+Standard'],
      },
      {
        name: 'MuscleTech NitroTech 100% Whey Gold 2.27kg',
        description: 'Whey protein isolate cao cấp, 24g protein, ít béo ít đường. Hương Cookies & Cream.',
        price: 1490000,
        stock: 35,
        categories: [whey],
        tags: ['whey', 'isolate', 'low-fat'],
        images: ['https://placehold.co/600x600?text=NitroTech'],
      },
      {
        name: 'Rule 1 R1 Protein 2.27kg',
        description: 'Whey isolate/hydrolysate siêu tinh khiết, 25g protein, 0g đường. Hương Vanilla.',
        price: 1650000,
        stock: 20,
        categories: [whey],
        tags: ['whey', 'isolate', 'zero-sugar'],
        images: ['https://placehold.co/600x600?text=Rule+1'],
      },
      {
        name: 'Cellucor C4 Original Pre-Workout 60 servings',
        description: 'Pre-workout năng lượng cao với Caffeine 150mg, Beta-Alanine, Creatine Nitrate. Hương Cherry Limeade.',
        price: 890000,
        stock: 40,
        categories: [preWorkout],
        tags: ['energy', 'pre-workout', 'caffeine'],
        images: ['https://placehold.co/600x600?text=C4+Original'],
      },
      {
        name: 'Ghost Legend V2 Pre-Workout 25 servings',
        description: 'Pre-workout cao cấp với L-Citrulline 4g, Caffeine 250mg. Hương Sour Watermelon.',
        price: 1050000,
        stock: 25,
        categories: [preWorkout],
        tags: ['premium', 'pre-workout', 'high-caffeine'],
        images: ['https://placehold.co/600x600?text=Ghost+Legend'],
      },
      {
        name: 'Xtend Original BCAA 90 servings',
        description: '7g BCAA (tỷ lệ 2:1:1), Glutamine, Citrulline Malate, điện giải. Hương Mango Madness.',
        price: 750000,
        stock: 60,
        categories: [bcaa],
        tags: ['bcaa', 'recovery', 'electrolytes'],
        images: ['https://placehold.co/600x600?text=Xtend+BCAA'],
      },
      {
        name: 'Applied Nutrition ABE EAA 375g',
        description: '9 axit amin thiết yếu, hỗ trợ tổng hợp protein cơ bắp. Hương Candy Ice Blast.',
        price: 620000,
        stock: 30,
        categories: [bcaa],
        tags: ['eaa', 'amino', 'recovery'],
        images: ['https://placehold.co/600x600?text=ABE+EAA'],
      },
      {
        name: 'Optimum Nutrition Micronized Creatine 600g',
        description: 'Creatine monohydrate siêu mịn, tăng sức mạnh & kích thước cơ. Unflavored, 120 servings.',
        price: 550000,
        stock: 80,
        categories: [creatine],
        tags: ['creatine', 'strength', 'unflavored'],
        images: ['https://placehold.co/600x600?text=ON+Creatine'],
      },
      {
        name: 'MuscleTech Platinum Creatine 400g',
        description: 'Creatine monohydrate HPLC-tested, 5g/serving, 80 servings. Không mùi vị.',
        price: 350000,
        stock: 100,
        categories: [creatine],
        tags: ['creatine', 'value', 'unflavored'],
        images: ['https://placehold.co/600x600?text=MT+Creatine'],
      },
      {
        name: 'Omega-3 Fish Oil 1000mg 200 viên',
        description: 'EPA 360mg + DHA 240mg/viên. Hỗ trợ tim mạch, khớp và não bộ.',
        price: 320000,
        stock: 150,
        categories: [vitamin],
        tags: ['omega-3', 'heart', 'joint'],
        images: ['https://placehold.co/600x600?text=Omega+3'],
      },
      {
        name: 'Multivitamin Daily 60 viên',
        description: 'Vitamin tổng hợp A, B, C, D, E, K, kẽm, sắt, magie. Dùng 1 viên/ngày.',
        price: 280000,
        stock: 200,
        categories: [vitamin],
        tags: ['multivitamin', 'daily', 'health'],
        images: ['https://placehold.co/600x600?text=Multivitamin'],
      },
      {
        name: 'Protein Bar hộp 12 thanh – Chocolate Brownie',
        description: '20g protein, 1g đường/thanh. Snack tiện lợi sau tập hoặc giữa bữa.',
        price: 580000,
        stock: 70,
        categories: [proteinBar],
        tags: ['snack', 'protein-bar', 'low-sugar'],
        images: ['https://placehold.co/600x600?text=Protein+Bar'],
      },
      {
        name: 'Bao tay tập gym có đệm',
        description: 'Chất liệu da tổng hợp + neoprene, đệm lòng bàn tay, quấn cổ tay. Size S-XL.',
        price: 250000,
        stock: 120,
        categories: [accessories],
        tags: ['gloves', 'gym', 'wrist-support'],
        images: ['https://placehold.co/600x600?text=Gym+Gloves'],
      },
      {
        name: 'Bình lắc Shaker 700ml',
        description: 'Bình shaker 2 ngăn, lưới lọc inox, chống rò rỉ. BPA-free.',
        price: 120000,
        stock: 200,
        categories: [accessories],
        tags: ['shaker', 'bottle', 'bpa-free'],
        images: ['https://placehold.co/600x600?text=Shaker'],
      },
      {
        name: 'Đai lưng mềm tập gym',
        description: 'Đai lưng neoprene 6 inch, hỗ trợ thắt lưng khi squat, deadlift. Size M-XXL.',
        price: 380000,
        stock: 45,
        categories: [accessories],
        tags: ['belt', 'support', 'squat'],
        images: ['https://placehold.co/600x600?text=Gym+Belt'],
      },
      {
        name: 'Hydroxycut Hardcore Elite 100 viên',
        description: 'Fat burner mạnh với Caffeine Anhydrous, Coleus Extract. Hỗ trợ giảm mỡ hiệu quả.',
        price: 680000,
        stock: 55,
        categories: [fatBurner],
        tags: ['fat-burner', 'weight-loss', 'thermogenic'],
        images: ['https://placehold.co/600x600?text=Hydroxycut'],
      },
      {
        name: 'L-Carnitine 3000 Liquid 480ml',
        description: 'L-Carnitine dạng nước, hấp thu nhanh, 3000mg/serving. Hương Green Apple. 32 servings.',
        price: 420000,
        stock: 65,
        categories: [fatBurner],
        tags: ['l-carnitine', 'liquid', 'fat-loss'],
        images: ['https://placehold.co/600x600?text=L-Carnitine'],
      },
      {
        name: 'Mass Gainer Serious Mass 5.4kg',
        description: '1250 calories, 50g protein/serving. Dành cho người gầy muốn tăng cân nhanh. Hương Chocolate.',
        price: 1850000,
        stock: 30,
        categories: [whey],
        tags: ['mass-gainer', 'weight-gain', 'high-calorie'],
        images: ['https://placehold.co/600x600?text=Serious+Mass'],
      },
    ]);

    this.logger.log(`Seeded ${products.length} products`);

    // ── Sample Customers ───────────────────────────────
    const hashedPassword = await bcrypt.hash('Customer@123', 10);

    const customers = await this.userRepo.save([
      {
        email: 'nguyenvana@gmail.com',
        password: hashedPassword,
        firstName: 'Văn A',
        lastName: 'Nguyễn',
        role: UserRole.CUSTOMER,
      },
      {
        email: 'tranthib@gmail.com',
        password: hashedPassword,
        firstName: 'Thị B',
        lastName: 'Trần',
        role: UserRole.CUSTOMER,
      },
      {
        email: 'levanc@gmail.com',
        password: hashedPassword,
        firstName: 'Văn C',
        lastName: 'Lê',
        role: UserRole.CUSTOMER,
      },
    ]);

    // Warehouse worker
    const warehousePassword = await bcrypt.hash('Warehouse@123', 10);
    await this.userRepo.save({
      email: 'warehouse@fitness.com',
      password: warehousePassword,
      firstName: 'Kho',
      lastName: 'Nhân viên',
      role: UserRole.WAREHOUSE_WORKER,
    });

    this.logger.log(`Seeded ${customers.length} customers + 1 warehouse worker`);

    // ── Physical Profiles ──────────────────────────────
    await this.profileRepo.save([
      {
        userId: customers[0].id,
        heightCm: 175,
        weightKg: 70,
        age: 25,
        fitnessGoal: FitnessGoal.MUSCLE_GAIN,
        dietaryPreferences: 'Ăn nhiều protein, ít carb',
      },
      {
        userId: customers[1].id,
        heightCm: 162,
        weightKg: 55,
        age: 28,
        fitnessGoal: FitnessGoal.WEIGHT_LOSS,
        dietaryPreferences: 'Eat clean, ít dầu mỡ',
        allergies: 'Sữa bò',
      },
      {
        userId: customers[2].id,
        heightCm: 180,
        weightKg: 85,
        age: 30,
        fitnessGoal: FitnessGoal.STRENGTH,
        dietaryPreferences: 'High protein, high carb',
      },
    ]);

    this.logger.log('Seeded 3 physical profiles');

    // ── Carts with items ───────────────────────────────
    const carts = await this.cartRepo.save([
      { userId: customers[0].id },
      { userId: customers[1].id },
      { userId: customers[2].id },
    ]);

    await this.cartItemRepo.save([
      { cartId: carts[0].id, productId: products[0].id, quantity: 1 },
      { cartId: carts[0].id, productId: products[7].id, quantity: 2 },
      { cartId: carts[1].id, productId: products[15].id, quantity: 1 },
      { cartId: carts[2].id, productId: products[3].id, quantity: 1 },
      { cartId: carts[2].id, productId: products[13].id, quantity: 3 },
    ]);

    this.logger.log('Seeded 3 carts with items');

    // ── Coupons ──────────────────────────────────────
    const coupons = await this.couponRepo.save([
      {
        code: 'WELCOME10',
        discountType: DiscountType.PERCENTAGE,
        discountValue: 10,
        minOrderAmount: 500000,
        maxDiscountAmount: 200000,
        usageLimit: 100,
        usedCount: 12,
        startDate: new Date('2025-01-01'),
        endDate: new Date('2026-12-31'),
        isActive: true,
      },
      {
        code: 'SUMMER2024',
        discountType: DiscountType.PERCENTAGE,
        discountValue: 15,
        minOrderAmount: 1000000,
        maxDiscountAmount: 500000,
        usageLimit: 50,
        usedCount: 48,
        startDate: new Date('2024-06-01'),
        endDate: new Date('2024-08-31'),
        isActive: false,
      },
      {
        code: 'GIAM50K',
        discountType: DiscountType.FIXED_AMOUNT,
        discountValue: 50000,
        minOrderAmount: 300000,
        usageLimit: 200,
        usedCount: 85,
        startDate: new Date('2025-01-01'),
        endDate: new Date('2026-12-31'),
        isActive: true,
      },
      {
        code: 'GIAM100K',
        discountType: DiscountType.FIXED_AMOUNT,
        discountValue: 100000,
        minOrderAmount: 800000,
        usageLimit: 50,
        usedCount: 20,
        startDate: new Date('2025-06-01'),
        endDate: new Date('2026-06-30'),
        isActive: true,
      },
      {
        code: 'VIP20',
        discountType: DiscountType.PERCENTAGE,
        discountValue: 20,
        minOrderAmount: 2000000,
        maxDiscountAmount: 1000000,
        usageLimit: 0,
        usedCount: 5,
        startDate: new Date('2025-01-01'),
        endDate: new Date('2026-12-31'),
        isActive: true,
      },
      {
        code: 'FREESHIP',
        discountType: DiscountType.FIXED_AMOUNT,
        discountValue: 30000,
        minOrderAmount: 0,
        usageLimit: 500,
        usedCount: 230,
        startDate: new Date('2025-01-01'),
        endDate: new Date('2026-12-31'),
        isActive: true,
      },
    ]);

    this.logger.log(`Seeded ${coupons.length} coupons`);

    // ── Orders ─────────────────────────────────────────
    const order1 = await this.orderRepo.save({
      userId: customers[0].id,
      status: OrderStatus.DELIVERED,
      totalAmount: Number(products[0].price) + Number(products[5].price) * 2,
      shippingAddress: '123 Nguyễn Huệ, Quận 1, TP.HCM',
    });
    await this.orderItemRepo.save([
      {
        orderId: order1.id,
        productId: products[0].id,
        quantity: 1,
        priceAtPurchase: products[0].price,
      },
      {
        orderId: order1.id,
        productId: products[5].id,
        quantity: 2,
        priceAtPurchase: products[5].price,
      },
    ]);

    const order2 = await this.orderRepo.save({
      userId: customers[1].id,
      status: OrderStatus.SHIPPED,
      totalAmount: Number(products[15].price) + Number(products[16].price),
      shippingAddress: '456 Lê Lợi, Quận 3, TP.HCM',
    });
    await this.orderItemRepo.save([
      {
        orderId: order2.id,
        productId: products[15].id,
        quantity: 1,
        priceAtPurchase: products[15].price,
      },
      {
        orderId: order2.id,
        productId: products[16].id,
        quantity: 1,
        priceAtPurchase: products[16].price,
      },
    ]);

    const order3 = await this.orderRepo.save({
      userId: customers[2].id,
      status: OrderStatus.PENDING,
      totalAmount: Number(products[17].price),
      shippingAddress: '789 Trần Hưng Đạo, Quận 5, TP.HCM',
    });
    await this.orderItemRepo.save([
      {
        orderId: order3.id,
        productId: products[17].id,
        quantity: 1,
        priceAtPurchase: products[17].price,
      },
    ]);

    const order4 = await this.orderRepo.save({
      userId: customers[0].id,
      status: OrderStatus.CONFIRMED,
      totalAmount: Number(products[3].price) + Number(products[8].price) - 50000,
      discountAmount: 50000,
      couponId: coupons[2].id,
      couponCode: coupons[2].code,
      shippingAddress: '123 Nguyễn Huệ, Quận 1, TP.HCM',
    });
    await this.orderItemRepo.save([
      {
        orderId: order4.id,
        productId: products[3].id,
        quantity: 1,
        priceAtPurchase: products[3].price,
      },
      {
        orderId: order4.id,
        productId: products[8].id,
        quantity: 1,
        priceAtPurchase: products[8].price,
      },
    ]);

    // ── Addresses ───────────────────────────────────────
    const address1 = await this.addressesRepo.save({
      street: '123 Nguyễn Huệ',
      state: 'TP.HCM',
      city: 'TP.HCM',
      isDefault: true,
      user: { id: customers[0].id },
    });

    const address2 = await this.addressesRepo.save({
      street: '456 Lê Lợi',
      state: 'TP.HCM',
      city: 'TP.HCM',
      isDefault: true,
      user: { id: customers[1].id },
    });

    const address3 = await this.addressesRepo.save({
      street: '789 Trần Hưng Đạo',
      state: 'TP.HCM',
      city: 'TP.HCM',
      isDefault: true,
      user: { id: customers[2].id },
    });

    this.logger.log('Seeded 3 addresses');
    this.logger.log('Seeded 4 orders with items');
    this.logger.log('Data seeding completed!');
  }
}
