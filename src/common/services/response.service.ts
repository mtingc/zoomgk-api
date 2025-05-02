import { Injectable } from '@nestjs/common';

import { EResponseCode } from '@common/enums';

@Injectable()
export class ResponseService {
    response(data: any, message: string, code: keyof typeof EResponseCode) {
        return {
            code,
            message,
            data
        }
    }
}
