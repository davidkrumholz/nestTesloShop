import { BadRequestException, HttpException, Injectable, InternalServerErrorException, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';

import * as bcrypt from 'bcrypt';
import { LoginUserDto, CreateUserDto, UserResponseDto } from './dto';
import { JwtPayload } from './interfaces/jwt-payload.interface';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class AuthService {
  
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly jwtService: JwtService,
    ) {}

  async create(createUserDto: CreateUserDto) {
    try {
      const { password, ...userData } = createUserDto;

      const user = this.userRepository.create({...userData,password: bcrypt.hashSync(password,10)});
      await this.userRepository.save(user);
      return user;
    } catch (error) {
     this.handleDBError(error);
    }
  }

  async login(loginUserDto: LoginUserDto): Promise<UserResponseDto> {
    const {email, password} = loginUserDto;

      const userExist = await this.userRepository.findOne({where: {email}, select: {email: true, id: true, password: true}});
      
      if(!userExist) {
        throw new UnauthorizedException('Credenciales no válidas, intente de nuevo - email');
      }

      if(!bcrypt.compareSync(password, userExist.password)) {
        throw new UnauthorizedException('Credenciales no válidas, intente de nuevo - password');
      }

      const token = this.getJwtToken({id: userExist.id});

      const userResponse: UserResponseDto = {
        id: userExist.id,
        email: userExist.email,
        token,
      };

      return userResponse;
  }

  async checkAuthStatus(user: User): Promise<UserResponseDto> {
    const token = this.getJwtToken({id: user.id});

    return {
      id: user.id,
      email: user.email,
      token,
    };
  }

  private getJwtToken(payload: JwtPayload) {
    const token = this.jwtService.sign(payload);
    return token;
  }

  private handleDBError(error: any): never {
    if( error.code === '23505') {
      throw new BadRequestException('No fue posible crear el usuario, intente de nuevo');
    }

    console.log(error);

    throw new InternalServerErrorException('Error inesperado, revise los logs del servidor');
  }
}
