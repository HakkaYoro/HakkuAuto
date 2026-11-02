import { IsBoolean, IsObject, IsOptional, IsString, MaxLength, MinLength, Matches } from 'class-validator';

export class CreateAccountDto {
  @IsString()
  @MinLength(1)
  @MaxLength(60)
  label!: string;

  @IsString()
  server!: string;

  @IsObject()
  credentials!: Record<string, string>;

  @IsOptional()
  @IsBoolean()
  autoRedeem?: boolean;
}

export class UpdateAccountDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(60)
  label?: string;

  @IsOptional()
  @IsString()
  server?: string;

  @IsOptional()
  @IsObject()
  credentials?: Record<string, string>;

  @IsOptional()
  @IsBoolean()
  autoRedeem?: boolean;
}

export class RedeemDto {
  @IsString()
  @Matches(/^[A-Za-z0-9_-]{3,32}$/)
  code!: string;
}

export class VerifyAccountDto {
  @IsString()
  server!: string;

  @IsObject()
  credentials!: Record<string, string>;
}
