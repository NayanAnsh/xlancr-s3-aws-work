import { BadRequestException, Body, Controller, Delete , Get, Post, Query, UploadedFile, UseInterceptors } from '@nestjs/common';
import {AwsS3Service } from './aws-s3/aws-s3.service';
import { FileInterceptor } from '@nestjs/platform-express';
import { ImageGenratorService } from './image-generator/image-generator.service';
import * as multer from "multer"
import { ImageInterceptor } from './image-interceptor/image-interceptor.interceptor';
import { ImageValidatorPipe } from './image-validator/image-validator.pipe';
//Using image inceptor as global because currently almost all routes accept image
@Controller('file')

export class FileController {
  constructor( private readonly s3Service: AwsS3Service,private readonly imageService: ImageGenratorService) {}

  /**
   * Route: POST /file/genimage
   * Accepts an image file and generates multiple resized images within a folder.
   */
  @Post('genimage')
  @UseInterceptors(FileInterceptor('image', {
    storage: multer.memoryStorage(), // Store file in memory
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB file size limit
  })
,ImageInterceptor
)
  async generateImages(
    @UploadedFile(
      ImageValidatorPipe
    ) file: Express.Multer.File,
    @Body() body: { folderName: string; fileCount: number; minRes: number; maxRes: number }
  ) {
    try {
      // Validate input fields

      if (!file) {
        throw new BadRequestException('Image file is required.');
      }
      if (!body.folderName || !body.fileCount || !body.minRes || !body.maxRes) {
        throw new BadRequestException('Missing required parameters.');
      }

      const { folderName, fileCount, minRes, maxRes } = body;
      
      // Save file temporarily
      // Generate images
      const generatedFiles = await this.imageService.generateMultipleImages(
        file.buffer,
        folderName,
        Number(fileCount),
        Number(minRes),
        Number(maxRes)
      );

     

      return { message: 'Images generated successfully.', files: generatedFiles };

    } catch (error) {
      console.error('Error generating images:', error);

      throw new BadRequestException('Failed to process image.');
    }
  }
  /**
   * Route: POST /file/resize
   * Accepts an image file and generates resized image within a folder.
   */
  @Post('resize')
  @UseInterceptors(FileInterceptor('image', {
    storage: multer.memoryStorage(), // Store file in memory
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB file size limit
  }),ImageInterceptor)
  async resizeImage(
    @UploadedFile(ImageValidatorPipe) file: Express.Multer.File,
    @Body() body: { folderName: string; width: number; height: number }
  ) {
    return await this.imageService.resizeImage(file.buffer, body.folderName, Number(body.width), Number(body.height));
  }
 /**
   * Route: POST /file/compressss
   * Accepts an image file and generates compressed image within a folder.
   */
  @Post('compress')
  @UseInterceptors(FileInterceptor('image', {
    storage: multer.memoryStorage(), // Store file in memory
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB file size limit
  }),ImageInterceptor)
  async compressImage(
    @UploadedFile(ImageValidatorPipe) file: Express.Multer.File,
    @Body() body: { folderName: string; quality: number }
  ) {
    return await this.imageService.compressImage(file.buffer, body.folderName, Number(body.quality));
  }
 /**
   * Route: POST /file/crop
   * Accepts an image file and generates cropped image within a folder.
   */
  @Post('crop')
  @UseInterceptors(FileInterceptor('image', {
    storage: multer.memoryStorage(), // Store file in memory
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB file size limit
  }),ImageInterceptor)
  async cropImage(
    @UploadedFile(ImageValidatorPipe) file: Express.Multer.File,
    @Body() body: { folderName: string; width: number; height: number; left: number; top: number }
  ) {
    return await this.imageService.cropImage(file.buffer, body.folderName, Number(body.width), Number(body.height), Number(body.left), Number(body.top));
  }

   /**
   * Get a signed URL for downloading a file from S3
   * @param key - The S3 object key (filename) to generate a URL for
   * @returns Standardized success or error response
   */
@Get('download')
   async getSignedUrl(@Query('key') key: string): Promise<any> {
     if (!key) {
       throw new BadRequestException('File key is required');
     }
 
     return await this.s3Service.getUploadedFile(key);
   }
 /**
   * Delete a file from S3
   * @param key - The S3 object key (filename) to delete
   * @returns Standardized success or error response
   */
  @Delete('delete')
 async deleteFile(@Query('key') key: string): Promise<any> {
   if (!key) {
     throw new BadRequestException('File key is required');
   }

   return this.s3Service.deleteFile(key);
 }

  @Post('upload')
  @UseInterceptors(FileInterceptor('file'),ImageInterceptor)
  async uploadFile(@UploadedFile(ImageValidatorPipe) file: Express.Multer.File) {
    
        const result = await this.s3Service.uploadFunc(file);

        if (result.success) {
        // Handle successful upload with result.data
        // const filename = result.data;
        return result;
        } else {
        // Handle error with result.error
        console.error(`Error ${result.error.code}: ${result.error.message}`);
        }
  }
 
//   @Post('upload')
//   async uploadFile(@UploadedFile() file: Express.Multer.File) {
//      // Example controller usage
//         const result = await this.s3Service.uploadFunc(file);

//         if (result.success) {
//         // Handle successful upload with result.data
//         // const filename = result.data;
//         return result;
//         } else {
//         // Handle error with result.error
//         console.error(`Error ${result.error.code}: ${result.error.message}`);
//         }
//   }

}
