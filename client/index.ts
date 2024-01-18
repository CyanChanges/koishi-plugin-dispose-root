import { Context } from '@koishijs/client'
import receiver from "./receiver";
import handler from "./handler";


export default (ctx: Context) => {
  globalThis.ctx = ctx;
  
  ctx.plugin(receiver);
  ctx.plugin(handler);
}
