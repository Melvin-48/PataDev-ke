import { createParamDecorator, ExecutionContext } from '@nestjs/common';

// Usage: findMine(@CurrentUser() user) - pulls the verified user off the request
export const CurrentUser = createParamDecorator((data: unknown, ctx: ExecutionContext) => {
  const request = ctx.switchToHttp().getRequest();
  return request.user;
});
