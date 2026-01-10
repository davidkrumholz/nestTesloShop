import { Injectable, Logger } from "@nestjs/common";
import { ProductsService } from "../products/products.service";
import { Repository } from "typeorm";
import { initialData } from "./data/seed-data";

@Injectable()
export class SeedService {
    private readonly logger = new Logger('SeedService');

    constructor(
        private readonly productsService: ProductsService
    ) {}
    async runSeed() {
        await this.insertNewProducts()
        return { message: 'Seed executed' };
    }

    private async insertNewProducts() {
     await this.productsService.deleteAllProducts();

     const products = initialData.products;

     const insertPromises = products.map(product => 
        this.productsService.create(product)
     );

     await Promise.all(insertPromises);
     return true;
    }
}