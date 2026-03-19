import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { Request, Response } from 'express';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger('HTTP');

  intercept(context: ExecutionContext): Observable<any> {
    const ctx = context.switchToHttp();
    const request = ctx.getRequest<Request>();
    const response = ctx.getResponse<Response>();
    const { method, url, body } = request;
    const startTime = Date.now();

    return new Observable((observer) => {
      observer.next();

      observer.complete();

      // Log after response
      response.on('finish', () => {
        const { statusCode } = response;
        const duration = Date.now() - startTime;

        this.logger.log(
          `${method} ${url} ${statusCode} - ${duration}ms`,
        );
      });
    });
  }
}
