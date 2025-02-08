import { Module } from '@nestjs/common';
import { AwsS3Service } from './aws-s3/aws-s3.service';
import { FileManipulationService } from './file-manipulation/file-manipulation.service';
import { FileController } from './file.controller';
import { ConfigModule } from '@nestjs/config';
import { ImageGenratorService } from './image-generator/image-generator.service';

@Module({
  imports:[ConfigModule.forRoot({})],
  providers: [AwsS3Service, FileManipulationService, ImageGenratorService],
  controllers: [FileController],
  exports:[AwsS3Service,FileManipulationService]

})
export class FileModule {}
