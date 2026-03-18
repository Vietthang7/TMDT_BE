import {
    Entity,
    PrimaryGeneratedColumn,
    ManyToOne,
    CreateDateColumn,
    Unique,
} from 'typeorm';
import { Wishlist } from './wishlist.entity';
import { Product } from '../../product/entities/product.entity';

@Entity('wishlist_items')
@Unique(['wishlist', 'product'])
export class WishlistItem {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Wishlist, (wishlist) => wishlist.items, {
    onDelete: 'CASCADE',
  })
  wishlist: Wishlist;

  @ManyToOne(() => Product, (product) => product.wishlistItems, {
    onDelete: 'CASCADE',
  })
  product: Product;

  @CreateDateColumn()
  createdAt: Date;
}