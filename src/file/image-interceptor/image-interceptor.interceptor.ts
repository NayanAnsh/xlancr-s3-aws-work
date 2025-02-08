/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { Observable } from 'rxjs';
import * as sharp from 'sharp';

@Injectable()
export class ImageInterceptor implements NestInterceptor {
  private readonly MAX_SIZE = 5 * 1024 * 1024; // 5MB threshold

  async intercept(context: ExecutionContext, next: CallHandler):Promise<Observable<any>>{
    // // Get the HTTP request object
    const request = context.switchToHttp().getRequest();
    
  
    if (request.file && request.file.size > this.MAX_SIZE) {
     console.log(request.file.buffer)
       request.file.buffer = await sharp(request.file.buffer as Buffer<ArrayBufferLike>)
         .resize({ width: 1024 }) // Resize to max width 1024px
         .jpeg({ quality: 80 }) // Compress to 80% quality
         .toBuffer();
      console.log(request.file.buffer)
      // Update file size after compression
      request.file.size = request.file.buffer.length;
    }  
        
    return next.handle();
  }
}
