import { PartialType } from "@nestjs/swagger";
import { CreateDeveloperProfileDto } from "./create-developer-profile.dto";

export class UpdateProfileDto extends PartialType(CreateDeveloperProfileDto) {}
