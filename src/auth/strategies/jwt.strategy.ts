import { PassportStrategy } from "@nestjs/passport";
import { ExtractJwt, Strategy } from "passport-jwt";
import { User } from "../entities/user.entity";
import { JwtPayload } from "../interfaces/jwt-payload.interface";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { ConfigService } from "@nestjs/config";
import { Injectable, InternalServerErrorException, UnauthorizedException } from "@nestjs/common";

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {

    constructor(
        @InjectRepository(User)
        private readonly userRepository: Repository<User>,
        configService: ConfigService
    ) {
        const jwtSecret = configService.get<string>('JWT_SECRET');
        if(!jwtSecret) {
            throw new InternalServerErrorException();
        }
        super({
            secretOrKey: jwtSecret,
            jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
        })
    }
    async validate(payload: JwtPayload): Promise<User> {
        const { email } = payload;
        
        const user = await this.userRepository.findOneBy({email});

        if(!user) {
        throw new UnauthorizedException('Usuario no encontrado');
        }

        if(!user.isActive) {
            throw new UnauthorizedException('Usuario inactivo');
        }
        return user;
    }
}