import {Context, Schema} from 'koishi';
import {} from '@koishijs/plugin-notifier';
import {Disposer} from "./disposer";

export const name = 'dispose-root';

export const usage = `# kp-dispose-root
The super-powered root disposing plugin for [Koishi](https://koishi.chat)  
Powered by [Cordis](https://github.com/shigma/cordis).

## What's this?
We make a plugin to show the disposibility of [Cordis](https://github.com/shigma/cordis).  
So we write it to dispose every single plugin every context Symbol of the root.  
This is [Cordis](https://github.com/shigma/cordis),  
You can write disposable plugin stupidly simple,
It is so easy to use and powerful.

## Links
[Cordis](https://github.com/shigma/cordis) |
[Shigma (Creator of Cordis)](https://github.com/shigma) | 
[Cyan Changes (Me)](https://github.com/CyanChanges)
`

export interface Config {
  disposer: Disposer.Config;
}

export const Config: Schema<Config> = Schema.object({disposer: Disposer.Config});

export function apply(ctx: Context, config: Config) {
  const logger = ctx.logger('dispose-root');

  logger.debug('dispose-root %c', 'apply')

  ctx.plugin(Disposer, config.disposer)
}
