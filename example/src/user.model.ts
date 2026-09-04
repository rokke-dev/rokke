import { Entity, PrimaryKey, Column, Model } from '@rokke/orm';

@Entity('users')
export class User extends Model<User> {
  @PrimaryKey()
  id!: number;

  @Column({ type: 'string' })
  username!: string;

  @Column({ type: 'string' })
  passwordHash!: string;
}
