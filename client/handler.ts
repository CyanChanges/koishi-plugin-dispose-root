import { Context, loading, message } from '@koishijs/client'
import DisposedNotice from "./DisposedNotice.vue";
import music from "./music.vue";


let loading1: ReturnType<typeof loading>
let msg1: ReturnType<typeof message.warning>

export default (ctx: Context) => {
  ctx.once('disposer/before-dispose', () => {
    ctx.slot({
      type: 'global',
      component: music
    })
    msg1 = message.warning({
      message: "dispose-root",
      duration: 9999999,
      zIndex: 999999
    });
  })

  ctx.once('disposer/dispose', () => {
    loading1 = loading({
      text: 'dispose-root is working'
    });
  })

  ctx.once('disposer/done', () => {
    ctx.slot({
      type: 'global',
      component: DisposedNotice
    });

    loading1?.close();
    msg1?.close();
    message.success('dispose-root successfully');
  })
}
