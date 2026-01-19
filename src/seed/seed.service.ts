import { Injectable, Logger } from "@nestjs/common";
import { ProductsService } from "../products/products.service";
import { Repository } from "typeorm";
import { initialData } from "./data/seed-data";
import { User } from "../auth/entities/user.entity";
import { InjectRepository } from "@nestjs/typeorm";

import * as bcrypt from 'bcrypt';

@Injectable()
export class SeedService {
    private readonly logger = new Logger('SeedService');

    constructor(
        private readonly productsService: ProductsService,
        @InjectRepository(User)
        private readonly userRepository: Repository<User>,
    ) {}
    async runSeed() {
        await this.deleteTables();
        const adminUser = await this.insertUsers();
        await this.insertNewProducts(adminUser);
        return { message: 'Seed executed' };
    }

    private async deleteTables() {
        await this.productsService.deleteAllProducts();
        const queryBuilder = this.userRepository.createQueryBuilder();
        await queryBuilder.delete().where({}).execute();
    }

    private async insertUsers() {
        const seedUsers = initialData.users;

        const usersToSave = seedUsers.map(user => ({
            ...user,
            password: bcrypt.hashSync(user.password, 10)
        }))

        const users: User[] = [];

        usersToSave.forEach( user => {
            users.push(this.userRepository.create(user));
        });

        const dbUsers = await this.userRepository.save(users);

        return dbUsers[0];
    }

    private async insertNewProducts(user: User) {
     const products = initialData.products;

     const insertPromises = products.map(product => 
        this.productsService.create(product, user)
     );

     await Promise.all(insertPromises);
     return true;
    }
}