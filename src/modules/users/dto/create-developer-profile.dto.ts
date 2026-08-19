import { ApiProperty } from "@nestjs/swagger";
import { IsString, IsArray, IsOptional, IsUrl } from "class-validator";

export class CreateDeveloperProfileDto {
  @ApiProperty({ example: "Jane Wanjiru" })
  @IsString()
  displayName!: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  bio?: string;

  @ApiProperty({ example: ["React", "NestJS", "PostgreSQL"] })
  @IsArray()
  techStack!: string[];

  @ApiProperty({ required: false })
  @IsOptional()
  @IsUrl()
  @IsString()
  portfolioUrl?: string;
}
