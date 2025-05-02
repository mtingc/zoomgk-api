import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';

import { ResponseService } from '@common/services';

@Injectable()
export class HashService {
    constructor(
        private readonly configService: ConfigService,
        private readonly responseService: ResponseService,
    ) { }

    async hashPassword(password: string) {
        try {
            const saltRounds = this.configService.get<number>('app.saltRounds');
            const salt = await bcrypt.genSalt(Number(saltRounds));
            const hash = await bcrypt.hash(password, salt);
            
            return this.responseService.response(hash, "Contraseña hasheada exitosamente", "SUCCESS");
        } catch (error) {
            return this.responseService.response(null, error.message, "ERROR");
        }
    }

    async comparePassword(password: string, hash: string) {
        try {
            const isMatch = await bcrypt.compare(password, hash);
            if (!isMatch) {
                return this.responseService.response(null, 'Contraseña incorrecta', "INVALID_CREDENTIALS");
            }

            return this.responseService.response(isMatch, "Contraseña correcta", "SUCCESS");
        } catch (error) {
            return this.responseService.response(null, error.message, "ERROR");
        }
    }
}
