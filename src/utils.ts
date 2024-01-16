import {Context} from "koishi";

export function keepVal(val: any, configurable = true): PropertyDescriptor {
  return {
    get() {
      return val;
    }, set() {},
    configurable
  };
}

export function *enumAllEffects(ctx: Context) {
  const frozen = Object.assign({},ctx)
  for (const key of Object.getOwnPropertySymbols(frozen)) {
    const result = frozen[key]
    if (result) yield result
  }
  for (const disposable of frozen.scope.disposables)
    yield disposable
}
