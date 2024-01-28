import { Context, receive, socket } from '@koishijs/client'
import { watch } from 'vue'

declare module '@koishijs/client' {
  // @ts-expect-error
  export interface Events {
    'disposer/before-dispose'()

    'disposer/dispose'()

    'disposer/done'()
  }
}

export default (ctx: Context) => {
  receive('disposer/before-dispose', () => {
    ctx.emit('disposer/before-dispose')
    socket.value.addEventListener('close', () => ctx.emit('disposer/done'))
    watch(socket, (socket) => {
      if (!socket)
        ctx.emit('disposer/done')
    })
  })

  receive('disposer/dispose', () => { 
    ctx.emit('disposer/dispose') 
    setTimeout(()=>ctx.emit('disposer/done'), 500)
  })

  receive('disposer/done', () => {
    ctx.emit('disposer/done')
  })
}
