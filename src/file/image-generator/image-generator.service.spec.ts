import { Test, TestingModule } from '@nestjs/testing';
import { ImageGenratorService } from './image-generator.service';

describe('ImageGenratorService', () => {
  let service: ImageGenratorService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ImageGenratorService],
    }).compile();

    service = module.get<ImageGenratorService>(ImageGenratorService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
