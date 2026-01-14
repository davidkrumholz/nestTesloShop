import { Matches, MinLength, IsEmail, IsString, MaxLength } from "class-validator";

export class LoginUserDto {
    @IsString()
    @IsEmail()
    email: string;
    @IsString()
    @MinLength(8)
    @MaxLength(32)
    @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/, {
        message: 'Password too weak',
    })
    password: string;
}