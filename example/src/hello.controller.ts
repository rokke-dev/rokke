import { Get, Controller, HttpRequestContext } from '@rokke/http';

@Controller('')
export class HelloController {
  @Get('/')
  index(ctx: HttpRequestContext) {
    return ctx.json({ hello: 'world', framework: 'rokke' });
  }
}
