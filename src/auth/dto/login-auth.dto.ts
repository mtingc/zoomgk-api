import { IsEmail, IsNotEmpty, IsString, MinLength, IsStrongPassword } from 'class-validator';

export class LoginAuthDto {
    @IsEmail({}, { message: 'Please provide a valid email address' })
    @IsNotEmpty({ message: 'Email is required' })
    @IsString({ message: 'Email must be a string' })
    email: string;

    @IsString({ message: 'Password must be a string' })
    @IsNotEmpty({ message: 'Password is required' })
    @MinLength(8, { message: 'Password must be at least 8 characters long' })
    @IsStrongPassword({
        minLength: 8,
        minLowercase: 1,
        minUppercase: 1,
        minNumbers: 1,
        minSymbols: 1,
    }, {
        message: 'Password must contain at least 1 uppercase letter, 1 lowercase letter, 1 number, and 1 symbol'
    })
    password: string;
}
