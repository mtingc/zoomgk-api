import { IsString, IsNotEmpty } from 'class-validator';

export class AuthTokenDto {
    @IsString()
    @IsNotEmpty()
    refreshToken: string;
}
