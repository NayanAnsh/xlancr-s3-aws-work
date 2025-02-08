import { Injectable } from '@nestjs/common';
import * as sharp from 'sharp';
import * as path from 'path'
import * as fs from 'fs';

@Injectable()
export class ImageGenratorService {

  async generateMultipleImages(
    imagePath: string,
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
      const filePath = await this.processAndSaveImage(imagePath, folderName, resolution);
      generatedFiles.push(filePath);
    }
    console.log("workeddd")
    return generatedFiles;
  }

  async processAndSaveImage(
    imagePath: string, 
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
    console.log("genratiingg")
    // Process and save image
    sharp.cache(false) //windows problem 
    await sharp(imagePath)
      .resize(resolution) // Resize image
      .jpeg({ quality: 80 }) // Set quality
      .toFile(outputFilePath);
      console.log(outputFilePath)

    return outputFilePath;
  }
}
