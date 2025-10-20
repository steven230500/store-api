import { Type } from 'class-transformer';
import {
  IsEmail,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Min,
  ValidateNested,
  Length,
} from 'class-validator';

class CardDto {
  @IsString()
  @Length(13, 19)
  number!: string;

  @IsString()
  @Length(3, 4)
  cvc!: string;

  @IsString()
  @Length(1, 2)
  exp_month!: string;

  @IsString()
  @Length(2, 4)
  exp_year!: string;

  @IsString()
  @IsNotEmpty()
  card_holder!: string;
}

export class CheckoutDto {
  @IsString()
  @IsNotEmpty()
  productId!: string;

  @IsEmail()
  email!: string;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  amountInCents!: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  installments?: number = 1;

  @ValidateNested()
  @Type(() => CardDto)
  card!: CardDto;
}
