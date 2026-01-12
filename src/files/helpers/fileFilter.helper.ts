import { BadRequestException } from "@nestjs/common";
import { Request } from "express";

export const fileFilter = (req: Request, file: Express.Multer.File, callback: Function) => {
    if(!file) return callback(new Error('File is empty'), false);

    const fileExtension = file.mimetype.split('/')[1];
    const validExtensions = ['jpg', 'jpeg', 'png', 'gif'];

    if(!validExtensions.includes(fileExtension)) {
        return callback(new BadRequestException(`File type ${file.mimetype.split('/')[1]} not allowed`), false);
    }
    callback(null, true);
}