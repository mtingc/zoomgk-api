import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

import { ResponseService } from '@common/services';

@Injectable()
export class ResponseInterceptor<T> implements NestInterceptor<T, any> {
    constructor(private readonly responseService: ResponseService) { }

    intercept(context: ExecutionContext, next: CallHandler<T>): Observable<any> {
        return next.handle().pipe(
            map((data) => {
                if (data && typeof data === 'object' && 'code' in data && 'message' in data && 'data' in data) {
                    return data;
                }

                return this.responseService.response(
                    data,
                    'Operación exitosa',
                    'SUCCESS'
                );
            }),
        );
    }
}