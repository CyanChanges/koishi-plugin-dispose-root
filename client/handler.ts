import { Context, loading, message } from '@koishijs/client'
import DisposedNotice from "./DisposedNotice.vue";


let loading1: ReturnType<typeof loading>
let msg1: ReturnType<typeof message.warning>

export default (ctx: Context) => {
  ctx.on('disposer/dispose', () => {
    msg1 = message.warning({
      message: "dispose-root",
      duration: 9999999,
      zIndex: 999999
    });
    loading1 = loading({
      text: 'dispose-root is working'
    });
  })
  ctx.on('disposer/done', ()=>{
    loading1.close();
    msg1.close();
    message.success('dispose-root successfully');
    ctx.slot({
      type: 'global',
      component: DisposedNotice
    });
  })
}
