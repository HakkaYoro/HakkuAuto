import { ArgumentsHost, Catch, ExceptionFilter, HttpException, HttpStatus } from '@nestjs/common';
import type { Response } from 'express';
import { DomainError } from '../../domain/shared/errors';

const NOT_FOUND = ['NotFoundError'];

/** Maps domain errors to HTTP semantics; everything else stays 500. */
@Catch()
export class DomainErrorFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost): void {
    const res = host.switchToHttp().getResponse<Response>();

    if (exception instanceof HttpException) {
      res.status(exception.getStatus()).json({ error: exception.message });
      return;
    }

    if (exception instanceof DomainError) {
      const status = NOT_FOUND.some((suffix) => exception.name.endsWith(suffix))
        ? HttpStatus.NOT_FOUND
        : HttpStatus.BAD_REQUEST;
      res.status(status).json({ error: exception.message });
      return;
    }

    const message = exception instanceof Error ? exception.message : 'Internal error';
    res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({ error: message });
  }
}
