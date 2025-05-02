import { IsEmail, IsNotEmpty, IsString } from 'class-validator';

export class RecoveryPassDto {
    @IsEmail({}, { message: 'Please provide a valid email address' })
    @IsNotEmpty({ message: 'Email is required' })
    @IsString({ message: 'Email must be a string' })
    email: string;
}