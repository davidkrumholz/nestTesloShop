import { BadRequestException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { existsSync } from 'fs';
import { join } from 'path';

@Injectable()
export class FilesService {
  constructor(private readonly configService: ConfigService) {}

  getStaticImage(type: string, imageName: string) {
    const path = join(process.cwd(), 'files', 'uploads', type, imageName);

    if(!existsSync(path)) {
      throw new BadRequestException(`Image ${imageName} not found`);
    }
    return path;
  }

  postStaticImage(type: string, file: Express.Multer.File) {
    if (!file) {
      throw new Error('File is required');
    }
    const secureUrl = `${this.configService.get('HOST_API') || 'http://localhost:3000/api'}/files/${type}/${file.filename}`;

    return {
      secureUrl
    };
  }
}
