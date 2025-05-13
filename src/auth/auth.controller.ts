import { Controller, Post, Body, Query, Get } from '@nestjs/common';

import { LoginAuthDto, SignupAuthDto, RecoveryPassDto, ResetPassDto, AuthTokenDto, RefreshTokenDto } from '@auth/dto';
import { AuthService } from '@auth/auth.service';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
  ) { }

  @Post('login')
  login(@Body() loginAuthDto: LoginAuthDto) {
    return this.authService.login(loginAuthDto);
  }

  @Post('signup')
  signup(@Body() signupAuthDto: SignupAuthDto) {
    return this.authService.signup(signupAuthDto);
  }

  @Post('recovery-pass')
  recoveryPass(@Body() recoveryPassDto: RecoveryPassDto) {
    return this.authService.recoveryPass(recoveryPassDto);
  }

  @Post('reset-pass')
  resetPass(
    @Body() resetPassDto: ResetPassDto,
    @Query('token') token: string,
  ) {
    return this.authService.resetPass(resetPassDto, token);
  }

  @Get("check-token")
  checkToken(@Query('token') token: string) {
    return this.authService.checkToken(token);
  }

  @Post('auth-token')
  authToken(@Body() authTokenDto: AuthTokenDto) {
    return this.authService.authToken(authTokenDto);
  }

  @Get('verify-account')
  verifyAccount(@Query('token') token: string) {
    return this.authService.verifyAccount(token);
  }

  @Post('logout')
  logout(@Body() refreshTokenDto: RefreshTokenDto) {
    return this.authService.logout(refreshTokenDto);
  }
}
