import {
    ExceptionFilter,
    Catch,
    ArgumentsHost,
    HttpException,
    HttpStatus,
} from '@nestjs/common';
import { Response } from 'express';
import { EResponseCode } from '@common/enums';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
    catch(exception: unknown, host: ArgumentsHost) {
        const ctx = host.switchToHttp();
        const response = ctx.getResponse<Response>();

        let status = HttpStatus.INTERNAL_SERVER_ERROR;
        let code = EResponseCode.INTERNAL_SERVER_ERROR;
        let message = 'Ha ocurrido un error interno';
        let data = null;

        if (exception instanceof HttpException) {
            const exResponse = exception.getResponse();
            status = exception.getStatus();

            if (typeof exResponse === 'string') {
                message = exResponse;
            } else if (typeof exResponse === 'object' && exResponse !== null) {
                const res = exResponse as Record<string, any>;

                if (res.message && Array.isArray(res.message)) {
                    code = EResponseCode.VALIDATION_ERROR;
                    message = res.message.join(', ');
                } else {
                    message = res.message || message;
                    code = res.code || code;
                    data = res.data || null;
                }
            }
        }

        response.status(status).json({
            code,
            message,
            data,
        });
    }
}