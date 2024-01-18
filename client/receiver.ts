import { Context, receive, socket } from '@koishijs/client'

declare module '@koishijs/client' {
  // @ts-expect-error
  export interface Events {
    'disposer/dispose'()
    'disposer/done'()
  }
}

export default (ctx: Context) => {
  receive('disposer/dispose', () => {
    ctx.emit('disposer/dispose')
    socket.value.addEventListener('close', () => ctx.emit('disposer/done'))
  })

  receive('disposer/done', () => {
    ctx.emit('disposer/done')
  })
}
