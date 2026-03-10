import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { FitnessGoal } from '../../../common/enums';
import { User } from '../../user/entities/user.entity';

@Entity('physical_profiles')
export class PhysicalProfile {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true })
  heightCm: number;

  @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true })
  weightKg: number;

  @Column({ nullable: true })
  age: number;

  @Column({
    type: 'enum',
    enum: FitnessGoal,
    default: FitnessGoal.GENERAL_FITNESS,
  })
  fitnessGoal: FitnessGoal;

  @Column({ type: 'text', nullable: true })
  dietaryPreferences: string;

  @Column({ type: 'text', nullable: true })
  allergies: string;

  @OneToOne(() => User, (user) => user.physicalProfile, { onDelete: 'CASCADE' })
  @JoinColumn()
  user: User;

  @Column()
  userId: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
