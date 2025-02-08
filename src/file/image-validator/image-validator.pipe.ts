/* eslint-disable @typescript-eslint/no-unsafe-return */
import {  BadRequestException, Injectable, PipeTransform } from '@nestjs/common';

@Injectable()
export class ImageValidatorPipe implements PipeTransform {
  transform(file: Express.Multer.File) {
    console.log("Pipe runing")
    if (!file) {
      throw new BadRequestException('File is required');
    }

    // Allowed MIME types
    const allowedMimeTypes = ['image/jpeg', 'image/png'];

    if (!allowedMimeTypes.includes(file.mimetype)) {
      throw new BadRequestException(
        `Invalid file type: ${file.mimetype}. Only ${allowedMimeTypes.join(",")} images are allowed.`,
      );
    }

    return file;
  }
}
