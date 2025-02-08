import { BadRequestException, Body, Controller, Delete, Get, Post, Query, UploadedFile, UseInterceptors } from '@nestjs/common';
import {AwsS3Service } from './aws-s3/aws-s3.service';
import { FileInterceptor } from '@nestjs/platform-express';
import { ImageGenratorService } from './image-generator/image-generator.service';
import * as fs from 'fs'
import * as multer from "multer"
@Controller('file')
export class FileController {
  constructor(private readonly s3Service: AwsS3Service,private readonly imageService: ImageGenratorService) {}

  /**
   * Route: POST /file/genimage
   * Accepts an image file and generates multiple resized images within a folder.
   */
  @Post('genimage')
  @UseInterceptors(FileInterceptor('file', {
    storage: multer.memoryStorage(), // Store file in memory
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB file size limit
  }))
  async generateImages(
    @UploadedFile() file: Express.Multer.File,
    @Body() body: { folderName: string; fileCount: number; minRes: number; maxRes: number }
  ) {
    const tempFilePath = `src/file/uploads/temp_${Date.now()}.jpg`;
    try {
      // Validate input fields
      console.log(file.buffer)
      if (!file) {
        throw new BadRequestException('Image file is required.');
      }
      if (!body.folderName || !body.fileCount || !body.minRes || !body.maxRes) {
        throw new BadRequestException('Missing required parameters.');
      }

      const { folderName, fileCount, minRes, maxRes } = body;
      
      // Save file temporarily
      fs.writeFileSync(tempFilePath, file.buffer);
      console.log("File written")
      // Generate images
      const generatedFiles = await this.imageService.generateMultipleImages(
        tempFilePath,
        folderName,
        Number(fileCount),
        Number(minRes),
        Number(maxRes)
      );

      // Cleanup temporary file
      fs.unlink(tempFilePath, (err) => {
        if (err) console.error('Error deleting temp file:', err);
      });

      return { message: 'Images generated successfully.', files: generatedFiles };

    } catch (error) {
      console.error('Error generating images:', error);
      fs.unlinkSync(tempFilePath);

      throw new BadRequestException('Failed to process image.');
    }
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
  @UseInterceptors(FileInterceptor('file'))
  async uploadFile(@UploadedFile() file: Express.Multer.File) {
    
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
