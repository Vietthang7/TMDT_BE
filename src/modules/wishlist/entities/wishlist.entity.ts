import {
    Entity,
    PrimaryGeneratedColumn,
    OneToOne,
    OneToMany,
    CreateDateColumn,
    JoinColumn,
} from 'typeorm';
import { User } from '../../user/entities/user.entity';
import { WishlistItem } from './wishlist-item.entity';

@Entity('wishlists')
export class Wishlist {
  @PrimaryGeneratedColumn()
  id: number;

  @OneToOne(() => User, (user) => user.wishlist, {
    onDelete: 'CASCADE',
  })
  @JoinColumn()
  user: User;

  @OneToMany(() => WishlistItem, (item) => item.wishlist)
  items: WishlistItem[];

  @CreateDateColumn()
  createdAt: Date;
}