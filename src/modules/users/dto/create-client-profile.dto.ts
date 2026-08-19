import { ApiProperty } from "@nestjs/swagger";
import { IsString, IsOptional } from "class-validator";

export class CreateClientProfileDto {
  @ApiProperty({ example: "Jaza Retailers Ltd" })
  @IsString()
  businessName!: string;

  @ApiProperty({ example: "Retail", required: false })
  @IsOptional()
  @IsString()
  businessType?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  phone?: string;
}
