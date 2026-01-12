import { Controller, Get, Post, Param, UploadedFile, UseInterceptors, Res } from '@nestjs/common';
import { FilesService } from './files.service';
import { FileUploadInterceptor } from './interceptors/file-upload.interceptor';
import express from 'express';

@Controller('files')
export class FilesController {
  constructor(private readonly filesService: FilesService) {}

  @Get(':type/:imageName')
  findProductImage(@Param('type') type: string, @Param('imageName') imageName: string, @Res() res: express.Response) {
    const path = this.filesService.getStaticImage(type, imageName);
    res.sendFile(path);
  }

  @Post(':type')
  @UseInterceptors(FileUploadInterceptor)
  uploadProductFile(
    @Param('type') type: string,
    @UploadedFile() file: Express.Multer.File
  ) {
    return this.filesService.postStaticImage(type, file);
  }
}
