import { BadRequestException, Injectable } from '@nestjs/common';
import * as sharp from 'sharp';
import * as path from 'path'
import * as fs from 'fs';

@Injectable()
export class ImageGenratorService {
/**
 * Generates multiple images with varying resolutions and saves them in a specified folder.
 * 
 * @param {Buffer<ArrayBufferLike>} imageBuffer - The image file data in buffer format.
 * @param {string} folderName - The name of the folder where images will be saved.
 * @param {number} fileCount - The number of images to generate.
 * @param {number} minResolution - The minimum resolution for the images.
 * @param {number} maxResolution - The maximum resolution for the images.
 * @returns {Promise<string[]>} - A promise that resolves to an array of generated file paths.
 */
  async generateMultipleImages(
    imageBuffer: Buffer<ArrayBufferLike>,
    folderName: string,
    fileCount: number,
    minResolution: number,
    maxResolution: number
  ): Promise<string[]> {
    const generatedFiles: string[] = [];
    
    // Generate `fileCount` images with evenly spaced resolutions
    const step = fileCount > 1 ? (maxResolution - minResolution) / (fileCount - 1) : 0;

    for (let i = 0; i < fileCount; i++) {
      const resolution = Math.round(minResolution + step * i);
      const filePath = await this.processAndSaveImage(imageBuffer, folderName, resolution);
      generatedFiles.push(filePath);
    }
   //Will return array of file paths 
    return generatedFiles;
  }

  async processAndSaveImage(
    imageBuffer: Buffer<ArrayBufferLike>, 
    folderName: string, 
    resolution: number
  ): Promise<string> {
    const outputDir = path.join(__dirname, 'gen', folderName);
    
    // Create folder if not exists
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    // Define output file name
    const outputFileName = `${folderName}_${resolution}.jpg`;
    const outputFilePath = path.join(outputDir, outputFileName);
  
    // Process and save image
    //sharp.cache(false) //windows problem  //Fixed!!! 
    await sharp(imageBuffer)
      .resize(resolution) // Resize image
    //  .jpeg({ quality: 80 }) // Set qual
      .toFile(outputFilePath);
      console.log(outputFilePath)

    return outputFilePath;
  }
  /**
   * Resize an image to the given width and height.
   * @param imageBuffer Buffer data of image , recommended to use multer storage to store file in memory and access it instead of using stream of internet packets 
   * @param folderName Target folder to save resized image
   * @param width Target width
   * @param height Target height
   */
  async resizeImage(imageBuffer: Buffer<ArrayBufferLike>, folderName: string, width: number, height: number): Promise<string> {
    try {
      const uploadDir = path.join(__dirname, '..' , 'uploads');

      const outputDir = path.join(uploadDir, folderName);
      if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
      }

      const outputFilePath = path.join(outputDir, `resized_${width}x${height}.jpg`);
      
      await sharp(imageBuffer)
        .resize(width, height)
        .jpeg({ quality: 80 })
        .toFile(outputFilePath);

      return outputFilePath;
    } catch (error) {
      throw new BadRequestException(`Failed to resize image: ${error}`);
    }
  }

/**
   * Compress an image to a given quality.
   * @param imageBuffer Buffer data of image , recommended to use multer storage to store file in memory and access it instead of using stream of internet packets 
   * @param folderName Target folder to save compressed image
   * @param quality Compression quality (1-100)
   */
async compressImage(imageBuffer: Buffer<ArrayBufferLike>, folderName: string, quality: number): Promise<string> {
  try {
    if (quality < 1 || quality > 100) {
      throw new BadRequestException('Quality must be between 1 and 100.');
    }
    const uploadDir = path.join(__dirname, '..' , 'uploads');

    const outputDir = path.join(uploadDir, folderName);
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    const outputFilePath = path.join(outputDir, `compressed_q${quality}.jpg`);

    await sharp(imageBuffer)
      .jpeg({ quality })
      .toFile(outputFilePath);

    return outputFilePath;
  } catch (error) {
    throw new BadRequestException(`Failed to compress image: ${error}`);
  }
}
/**
   * Crop an image to the given dimensions.
   * @param imageBuffer Buffer data of image , recommended to use multer storage to store file in memory and access it instead of using stream of internet packets 
   * @param folderName Target folder to save cropped image
   * @param width Crop width
   * @param height Crop height
   * @param left X offset
   * @param top Y offset
   */
async cropImage(imageBuffer: Buffer<ArrayBufferLike>, folderName: string, width: number, height: number, left: number, top: number): Promise<string> {
  try {
    const uploadDir = path.join(__dirname, '..' , 'uploads');
    const outputDir = path.join(uploadDir, folderName);
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    const outputFilePath = path.join(outputDir, `cropped_${width}x${height}.jpg`);

    await sharp(imageBuffer)
      .extract({ width, height, left, top })
      .toFile(outputFilePath);

    return outputFilePath;
  } catch (error) {
    throw new BadRequestException(`Failed to crop image: ${error}`);
  }
}

}
