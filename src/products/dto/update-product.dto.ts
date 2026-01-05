import { PartialType, OmitType } from '@nestjs/mapped-types';
import { CreateProductDto } from './create-product.dto';
import { UpdateProductImageDto } from './update-product-image.dto';

export class UpdateProductDto extends OmitType(PartialType(CreateProductDto), ['images'] as const) {
    images?: UpdateProductImageDto[];
}
