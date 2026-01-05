import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Product, ProductImage } from './entities';
import { DataSource, Repository } from 'typeorm';
import { PaginationDto } from 'src/common/dtos/pagination.dto';
import { validate as isUUID } from 'uuid';
import { UpdateProductImageDto } from './dto/update-product-image.dto';

@Injectable()
export class ProductsService {
  private readonly logger = new Logger('ProductsService');

  constructor(
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,

    @InjectRepository(ProductImage)
    private readonly productImageRepository: Repository<ProductImage>,

    private readonly dataSource: DataSource,
  ) {}

  async create(createProductDto: CreateProductDto) {
    try {

      const {images = [], ...productDetails} = createProductDto; 
      const product = this.productRepository.create({...productDetails, images: images.map(image => this.productImageRepository.create({url: image}))});

      await this.productRepository.save(product);

      return {...product, images}; // Retornar las URLs en lugar de las entidades completas
    } catch (error) {
      this.handleExceptions(error);
    }
  }

  async findAll(paginationDto: PaginationDto) {
    const { limit = 10, offset = 0 } = paginationDto;
    const [products, total] = await this.productRepository.findAndCount({
      take: limit,
      skip: offset,
      relations: {
        images: true,
      },
    });
    const pageSize = limit;
    const totalPages = pageSize ? Math.ceil(total / pageSize) : 0;
    const currentPage = pageSize ? Math.floor(offset / pageSize) + 1 : 1;

    const mappedProduct = products.map(product => ({
      ...product,
      images: product.images?.map(img => img.url) ?? []
    }));

    return {
      data: products,
      metadata: {
        total_items: total,
        current_page: currentPage,
        page_size: pageSize,
        total_pages: totalPages,
      },
    };
  }

  async findOne(term: string) {
    let product: Product | null = null;

    if (isUUID(term)) {
      product = await this.productRepository.findOneBy({ id: term });
    } else {
      const queryBuilder = this.productRepository.createQueryBuilder('product');
      product = await queryBuilder
        .where(`title =:title or slug =:slug`, {
          title: term,
          slug: term,
        })
        .leftJoinAndSelect('product.images', 'productImages')
        .getOne();
    }

    if (!product)
      throw new NotFoundException(`The product with ${term} was not found`);

    return product;
  }

  async findOnePlain(term: string) {
    const {images = [], ...product} = await this.findOne(term);
    return {
      ...product,
      images: images.map(img => img.url)
    };
  }

  async update(id: string, updateProductDto: UpdateProductDto & UpdateProductImageDto) {
   
    const {images = [], ...toUpdated} = updateProductDto;
   
    const product = await this.productRepository.preload({
      id,
      ...toUpdated
    });

    if(!product)
      throw new NotFoundException(`The product with id ${id} was not found`);

    // Create query runner
    const queryRunner = this.dataSource.createQueryRunner();

    await queryRunner.connect();

    await queryRunner.startTransaction();

    try {
      const existingImages = await queryRunner.manager.find(ProductImage, {
        where: {product: {id}}
      });

      // Crear un mapa de imágenes existentes por ID para acceso rápido
      const existingImagesMap = new Map(
        existingImages.map(img => [img.id, img])
      );

      // IDs de imágenes que vienen en el request
      const incomingImageIds = new Set(
        images.filter(img => img.id).map(img => img.id!)
      );

      // Eliminar imágenes que no están en el request
      const imagesToDelete = existingImages.filter(
        img => !incomingImageIds.has(img.id)
      );
      
      if(imagesToDelete.length > 0) {
        await queryRunner.manager.remove(ProductImage, imagesToDelete);
      }

      // Procesar imágenes: actualizar existentes o crear nuevas
      product.images = images.map(img => {
        if (img.id && existingImagesMap.has(img.id)) {
          // Actualizar imagen existente
          const existingImage = existingImagesMap.get(img.id)!;
          existingImage.url = img.url;
          return existingImage;
        }
        // Crear nueva imagen
        return this.productImageRepository.create({
          url: img.url,
          product
        });
      });

      await queryRunner.manager.save(product);
      await queryRunner.commitTransaction();
      await queryRunner.release();
      return this.findOne(id);
    } catch (error) {
      await queryRunner.rollbackTransaction();
      await queryRunner.release();
      this.handleExceptions(error);
    }
  }

  async remove(id: string) {
    const product = await this.findOne(id);

    await this.productRepository.remove(product);
  }

  private handleExceptions(error: any) {
    if (error.code === '23505') {
      throw new BadRequestException(error.detail);
    }

    this.logger.error(error);
    throw new InternalServerErrorException('Unexpected error');
  }
}
