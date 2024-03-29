import { Context, Service } from "koishi";
import { Get } from 'cosmokit'
import NotifierService from "@koishijs/plugin-notifier";
import type {} from './disposer'
import { MouseEventHandler } from "react";

declare module 'koishi' {
  interface Context {
    'disposer.notifier': DisposerNotifier;
  }
}

declare global {
  export namespace React {
    export interface DOMAttributes<T> {
      // @ts-ignore
      onclick?: any
    }
  }
}

export class DisposerNotifier extends Service {
  protected notifier: ReturnType<Get<NotifierService, 'create'>>;

  static inject = ['notifier']

  constructor(protected ctx: Context) {
    super(ctx, 'disposer.notifier', true);
    this.logger = ctx.logger(this.name)

    this.notifier = ctx.notifier.create({
      type: 'primary'
    });
  }

  async start() {
    this.logger.debug('dispose-root notifier %c', 'ready')
    this.notify();
  }

  handle() {
    this.logger.warn('dispose root!');
    this.ctx.serial('disposer/dispose', 'notifier').then();
  }

  notify() {
    this.notifier.update(<>
      <p><small>kp-</small>dispose-root is ready!</p>
      <p>
        <button onclick={() => this.handle()}>Dispose now!</button>
      </p>
    </>);
  }
}

export default DisposerNotifier;
