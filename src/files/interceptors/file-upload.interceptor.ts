import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { fileFilter, fileNamer } from '../helpers';
import { Request } from 'express';

@Injectable()
export class FileUploadInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler) {
    const request = context.switchToHttp().getRequest<Request>();
    const type = request.params.type;

    // Crear el interceptor de archivo con configuración dinámica
    const FileInterceptorClass = FileInterceptor('file', {
      fileFilter: fileFilter,
      limits: { fileSize: 1024 * 1024 * 5 }, // 5MB
      storage: diskStorage({
        destination: (req: Request, file: Express.Multer.File, cb: Function) => {
          const typeFromRequest = req.params.type;
          cb(null, `./files/uploads/${typeFromRequest}`);
        },
        filename: fileNamer,
      }),
    });

    // Instanciar y aplicar el interceptor
    const interceptorInstance = new FileInterceptorClass();
    return interceptorInstance.intercept(context, next);
  }
}

