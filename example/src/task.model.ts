import { Column, Entity, Model, PrimaryKey } from "@rokke/orm";

@Entity("tasks")
export class Task extends Model<Task> {
  @PrimaryKey()
  id!: number;

  @Column({ type: "number" })
  ownerId!: number;

  @Column()
  title!: string;

  @Column()
  description!: string;

  @Column({ type: "boolean" })
  completed!: boolean | number;

  @Column()
  createdAt!: string;

  @Column()
  updatedAt!: string;
}
