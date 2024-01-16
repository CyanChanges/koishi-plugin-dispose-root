import {enumAllEffects, keepVal} from "./utils";
import {Lifecycle} from "cordis";
import {Context, Schema, Service, ForkScope} from "koishi";
import DisposerNotifier from './notifier';

declare module 'koishi' {
  export interface Context {
    disposer: Disposer;
  }

  interface Events {
    'disposer/dispose'(source: string | undefined): void;
  }
}

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

    ctx.on('disposer/dispose', () => this.dispose());
  }

  start() {
    if (this.config.immediately)
      this.dispose();

    this.ctx.inject(['notifier'], ctx => {
      ctx.plugin(DisposerNotifier);
    });
  }


  dispose = () => {
    const ctx = this.ctx;
    const rScope = this.rScope;
    const scope = this.scope;

    this.logger.info('root disposing is in progress...');

    for (const data of enumAllEffects(ctx.root)) {
      let inst = typeof data === 'string' ? ctx.root[data] : data;
      let context: Context | undefined = inst;
      let runtime = context?.runtime;
      let scope = context?.scope;

      if (!inst) continue;

      if (inst instanceof Lifecycle) {
        this.lifecycle = inst;
        continue;
      } else if (inst instanceof Context) {} else if (inst[Context.static] instanceof Context) {
        context = inst[Context.static];
        runtime = context.runtime;
        scope = context.scope;
      } else continue;

      if (runtime?.name === 'group') {
        if (this.config.disableToo)
          rScope.ensure(async () => {
            const key = rScope.ctx.loader.keyFor(runtime.plugin);
            rScope.ctx.loader.unload(rScope.ctx, key);
          });
        rScope.ensure(async () => {
          scope.dispose();
        });
      }

      rScope.ensure(async () => {
        this.logger.info('dispose %c', runtime.name);
        scope.dispose();
        runtime.dispose();
        rScope.ctx.registry.delete(runtime.plugin);
      });
    }

    rScope.ctx.setTimeout(()=>this.done(), this.config.noLifecycleDelay)
  };
}

export namespace Disposer {
  export interface Config {
    disableToo: boolean;
    immediately: boolean;
    noLifecycleDelay: number;
  }

  export const Config: Schema<Config> = Schema.object({
    disableToo: Schema.boolean().default(false).description("同时禁用插件").experimental(),
    immediately: Schema.boolean().default(false).description("启动插件即刻开始 dispose, " +
      "关闭即可手动选择 dispose (需要 plugin-notifier)"),
    noLifecycleDelay: Schema.number().role('time').default(300).description("(毫秒) 过指定时间停止事件系统")
  });
}
