import { PartialType } from '@nestjs/swagger';
import { CreateDeveloperProfileDto } from './create-developer-profile.dto';

// Reused for both profile types at the field level; split further if the two
// profiles diverge more once real requirements settle.
export class UpdateProfileDto extends PartialType(CreateDeveloperProfileDto) {}
