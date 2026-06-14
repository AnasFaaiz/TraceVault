import { IsString, IsNotEmpty, IsIn, Length } from "class-validator";

export class VerifyMfaDto {
  @IsString()
  @IsNotEmpty()
  mfaSessionToken: string;

  @IsIn(['totp', 'email'])
  method: 'totp' | 'email';

  @IsString()
  @Length(6,6, { message: 'Verification code must be exactly 6 character long'})
  code: string;
}

export class RequestEmailOtpDto {
  @IsString()
  @IsNotEmpty()
  mfaSessionToken: string;
}
