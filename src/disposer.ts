import { asPromise, enumAllEffects, keepVal, rename } from "./utils";
import { Lifecycle } from "cordis";
import { Context, Schema, Service, ForkScope, Loader, Awaitable } from "koishi";
import * as cordis from 'cordis';
import DisposerNotifier from './notifier';
import { promisify } from "node:util";

declare module 'koishi' {
  export interface Context {
    disposer: Disposer;
  }

  interface Events {
    'disposer/dispose'(source: string | undefined): void;
  }
}

type Updates = 'apply' | 'unload' | 'dispose' | 'disable'

export class Disposer extends Service {
  notifier: DisposerNotifier;
  private rScope: ForkScope;
  private scope: ForkScope;
  lifecycle: Lifecycle | undefined = undefined;

  done = () => {
    if (this.lifecycle instanceof Lifecycle) {
      const lifecycle = this.lifecycle;
      // remove all hooks
      lifecycle._hooks = {};
      let nonSideEffect: any = () => (() => {
      });
      lifecycle.parallel = lifecycle.serial = lifecycle.bail = lifecycle.on = nonSideEffect;
      lifecycle.register = nonSideEffect;
      (lifecycle['root'] as Context).logger('lifecycle')
        .success('effects are cleared!');
      return true;
    } else {
      return false;
    }
  };

  constructor(protected ctx: Context, protected config: Disposer.Config) {
    super(ctx, 'disposer', config.immediately);

    this.rScope = Object.defineProperty(
      Object.defineProperty(ctx.root.scope, 'uid', keepVal((0))), 'isActive', keepVal(true)
    );
    this.scope = Object.defineProperty(
      Object.defineProperty(ctx.scope, 'uid', keepVal((ctx.scope.uid))), 'isActive', keepVal(true)
    );

    ctx.on('disposer/dispose', async () => await this.dispose());
  }

  start() {
    if (this.config.immediately)
      this.dispose();

    this.ctx.inject(['notifier'], ctx => {
      ctx.plugin(DisposerNotifier);
    });
  }

  private _logUpdate: { [P in Updates | string]: <T = ForkScope>(scope: T) => T };

  get logUpdate(): { [P in Updates | string]: <T = ForkScope>(scope: T) => T } {
    if (this._logUpdate) return this._logUpdate;

    let log = (action: string, fork: ForkScope) => {
      this.logger.success('%C(%c) %c', fork.runtime.name ?? 'anonymous', fork.key ?? fork.uid ?? fork.runtime.uid ?? 'unknown', action);
      return fork
    }
    return new Proxy(Object.create(null), {
      get(target, prop) {
        if (prop in target) return target[prop];
        return (...args: any[]) => log.apply(this, [prop, ...args]);
      }
    });
  };

  toDispose = (fork: ForkScope) => {
    if (!fork) return;
    if (fork.runtime.plugin === null && this.config.keepApp) return
    if (fork.runtime.name === 'group') fork.dispose();

    const app = this.rScope.ctx
    if (!app) return
    try {
      this.rScope.assertActive()
    } catch {
      return
    }

    if (this.config.disableToo)
      this.rScope.ensure(async () => {
        if (fork.uid || !fork.parent.scope[Loader.kRecord]) return;
        const key = Object.keys(fork.parent.scope[Loader.kRecord]).find(key => {
          return fork.parent.scope[Loader.kRecord][key] === fork;
        });
        this.logUpdate.disable(fork);
        rename(fork.parent.scope.config, key, '~' + key, fork.parent.scope.config[key]);
        app.loader.unload(this.logUpdate.unload(fork).ctx, key);
      });

    this.rScope.ensure(async () => {
      this.logUpdate.dispose(fork).dispose();
      if (app.registry)
        app.registry['_counter'] -= 1
    });
  };

  disposeContexts = async (app: Context, sockets: WebSocket[]) => {
    const tasks: (Promise<any>)[] = []

    tasks.push(asPromise(() => {
      const s = JSON.stringify({
        type: 'disposer/done',
        data: null
      })

      sockets.forEach(socket => socket.send(s))
    }, []))

    tasks.push(asPromise(async () => app['console.writer']?.writeConfig(), []))

    this.logger.info('disposing is in progress...');

    for (const data of enumAllEffects(app)) {
      let inst = typeof data === 'string' ? app[data] : data;
      let context: Context | undefined = inst;
      let runtime = context?.runtime;
      let scope = context?.scope;

      if (!inst) continue;

      if (inst instanceof Lifecycle) {
        this.lifecycle = inst;
        continue;
      } else if (context instanceof Context) {} else if (inst[Context.static] instanceof Context) {
        context = inst[Context.static];
        runtime = context.runtime;
        scope = context.scope;
      } else if (inst instanceof cordis.EffectScope) {
        context = inst.ctx;
        runtime = inst.runtime;
        scope = inst;
      } else if (inst[Context.current]) {
        tasks.push(asPromise(() => {
          const fork = inst[Context.current]?.scope
          if (!fork) return
          this.logUpdate.dispose(fork).dispose();
        }, [], this))
      } else continue;

      tasks.push(asPromise(this.toDispose, [scope], this));
    }

    app.setTimeout?.(() => this.done(), this.config.noLifecycleDelay);

    tasks.push(asPromise(app.on, ['internal/fork', this.toDispose], app.lifecycle))

    const s = JSON.stringify({
      type: 'disposer/dispose',
      data: null
    })

    sockets.forEach(socket => socket.send(s))

    return await Promise.all(tasks.reverse())
  }

  dispose = (source: any = undefined): Promise<(() => Promise<void>)[]> => {
    const rScope = this.rScope;
    const app = rScope.ctx

    let sockets = []

    if (!this.ctx.scope.isActive) return

    if (app.console) {
      const s = JSON.stringify({
        type: 'disposer/before-dispose',
        data: null
      })

      sockets = Object.values(app.console.clients).map(client => client.socket)
      sockets.forEach(socket => socket.send(s))
    }

    return new Promise(resolve =>
      app.setTimeout(async () => resolve(await this.disposeContexts(app, sockets)), 0)
    )
  };
}

export namespace Disposer {
  export interface Config {
    disableToo: boolean;
    immediately: boolean;
    keepApp: boolean
    noLifecycleDelay: number;
  }

  export const Config: Schema<Config> = Schema.object({
    disableToo: Schema.boolean().default(false).description("同时禁用插件").experimental(),
    immediately: Schema.boolean().default(false).description("启动插件即刻开始 dispose, " +
      "关闭即可手动选择 dispose (需要 plugin-notifier)"),
    keepApp: Schema.boolean().default(false).description('不要 dispose 根上下文 (将会出发全局重载)'),
    noLifecycleDelay: Schema.number().role('time').default(100).description("(毫秒) 过指定时间停止事件系统")
  });
}
