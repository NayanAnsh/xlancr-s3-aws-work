/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import { Injectable } from '@nestjs/common';
import { DeleteObjectCommand, GetObjectCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { ConfigService } from '@nestjs/config';
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

/**
 * Standard error response format for service operations
 */
export interface ErrorResponse {
  success: false;
  error: {
    message: string;
    code?: string; // Optional error code for specific error handling
  };
}

/**
 * Standard success response format for service operations
 */
export type SuccessResponse<T> = {
  success: true;
  data: T;
};

/**
 * Generic service result type that can be either success or error
 */
export type ServiceResult<T> = SuccessResponse<T> | ErrorResponse;

@Injectable()
export class AwsS3Service {
  private readonly s3: S3Client;
  private readonly BUCKET_NAME: string;

  constructor(private configService: ConfigService) {
    this.BUCKET_NAME = this.getConfigValue('BUCKET_NAME');
    const BUCKET_REGION = this.getConfigValue('BUCKET_REGION');
    const ACCESS_KEY = this.getConfigValue('ACCESS_KEY');
    const SECRET_ACCESS_KEY = this.getConfigValue('SECRET_ACCESS_KEY');

    this.s3 = new S3Client({
      credentials: {
        accessKeyId: ACCESS_KEY,
        secretAccessKey: SECRET_ACCESS_KEY,
      },
      region: BUCKET_REGION,
    });
  }

  /**
   * Safely retrieves configuration values with validation
   * @param key - Configuration key to retrieve
   * @returns Configuration value
   * @throws Error when configuration value is missing
   */
  private getConfigValue(key: string): string {
    const value = this.configService.get<string>(key);
    if (!value) {
      throw new Error(`Missing required configuration: ${key}`);
    }
    return value;
  }

  /**
   * Uploads a file to S3 bucket
   * @param file - Multer file object to upload
   * @returns ServiceResult with uploaded filename or error
   */
  async uploadFunc(file: Express.Multer.File): Promise<ServiceResult<string>> {
    try {
      if (!file) {
        throw new Error('File is undefined');
      }
      
      if (!file.originalname?.trim()) {
        throw new Error('Invalid file name');
      }

      const filename = `${Date.now()}-${file.originalname.replace(/\s+/g, '-')}`;

      const params = {
        Bucket: this.BUCKET_NAME,
        Key: filename,
        Body: file.buffer,
        ContentType: file.mimetype || 'application/octet-stream',
      };

      const command = new PutObjectCommand(params);
      await this.s3.send(command);
      
      return { 
        success: true, 
        data: filename 
      };
    } catch (error) {
      return {
        success: false,
        error: {
          message: error instanceof Error ? error.message : 'Unknown upload error',
          code: this.getErrorCode(error)
        }
      };
    }
  }

  /**
   * Generates a pre-signed URL for accessing a private S3 object
   * @param key - S3 object key to generate URL for
   * @returns ServiceResult with signed URL or error
   */
  async getUploadedFile(key: string): Promise<ServiceResult<string>> {
    try {
      const getObjectParams = {
        Bucket: this.BUCKET_NAME,
        Key: key,
      };

      const command = new GetObjectCommand(getObjectParams);
      const url = await getSignedUrl(this.s3, command, { expiresIn: 3600 });
      
      return {
        success: true,
        data: url
      };
    } catch (error) {
      return {
        success: false,
        error: {
          message: error instanceof Error ? error.message : 'Failed to generate signed URL',
          code: this.getErrorCode(error)
        }
      };
    }
  }

  /**
   * Deletes a file from S3 bucket
   * @param key - S3 object key to delete
   * @returns ServiceResult with success confirmation or error
   */
  async deleteFile(key: string): Promise<ServiceResult<string>> {
    try {
      const deleteObjectParams = {
        Bucket: this.BUCKET_NAME,
        Key: key,
      };

      const command = new DeleteObjectCommand(deleteObjectParams);
      await this.s3.send(command);
      
      return {
        success: true,
        data: `File "${key}" deleted successfully`
      };
    } catch (error) {
      return {
        success: false,
        error: {
          message: error instanceof Error ? error.message : 'Failed to delete file',
          code: this.getErrorCode(error)
        }
      };
    }
  }

  /**
   * Extracts error code from AWS errors if available
   * @param error - Error object from AWS SDK
   * @returns Error code string or undefined
   */
  private getErrorCode(error: unknown): string | undefined {
    if (typeof error === 'object' && error !== null && 'code' in error) {
      return (error as { code: string }).code;
    }
    return undefined;
  }
}