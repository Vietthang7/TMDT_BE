import {
    Entity, 
    PrimaryGeneratedColumn,
    Column,
    ManyToOne,
    JoinTable,
    JoinColumn,
} from 'typeorm';
import { User } from '../../user/entities/user.entity';

@Entity('addresses')
export class Addresses {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column()
    street: string;

    @Column()
    state: string;

    @Column()
    city: string;

    @Column({ default: false })
    isDefault: boolean;

    @ManyToOne(() => User, (user) => user.addresses)
    @JoinColumn({ name: 'userId' }) 
    user: User;

    @Column()
    userId: string;
}