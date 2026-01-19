import { Product } from "../../products/entities";
import { BeforeInsert, BeforeUpdate, Column, Entity, OneToMany, PrimaryGeneratedColumn } from "typeorm";

@Entity('users')
export class User {
    @PrimaryGeneratedColumn('uuid')
    id: string;
    @Column({ type: 'text', unique: true })
    email: string;
    @Column({ type: 'text', select: false })
    password: string;
    @Column({ type: 'text' })
    fullName: string;
    @Column({ type: 'boolean', default: false })
    isActive: boolean;
    @Column({ type: 'text', array: true, default: [] })
    roles: string[];
    
    @OneToMany(
        () => Product,
        (product) => product.user,
    )
    product: Product;

    @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
    createdAt: Date;
    @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP', onUpdate: 'CURRENT_TIMESTAMP' })
    updatedAt: Date;

    @BeforeInsert()
    checkFieldsBeforeInsert() {
        this.email = this.email.toLowerCase().trim();
    }

    @BeforeUpdate()
    checkFieldsBeforeUpdate() {
        this.email = this.email.toLowerCase().trim();
    }
}
