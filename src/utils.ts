import { Awaitable, Context, Promisify } from "koishi";

export function keepVal(val: any, configurable = true): PropertyDescriptor {
  return {
    get() {
      return val;
    }, set() {},
    configurable
  };
}

export function* enumAllEffects(ctx: Context) {
  const frozen = Object.assign({}, ctx);
  if (ctx.registry['_internal'] instanceof Map) {
    yield* ctx.registry['_internal'].values();
  } else
    for (const key of Object.getOwnPropertySymbols(frozen)) {
      const result = frozen[key];
      if (result) yield result;
    }
  for (const disposable of frozen.scope.disposables)
    yield disposable;
}


export function insertKey(object: {}, temp: {}, rest: string[]) {
  for (const key of rest) {
    temp[key] = object[key];
    delete object[key];
  }
  Object.assign(object, temp);
}

export function rename(object: any, old: string, neo: string, value: any) {
  const keys = Object.keys(object);
  const index = keys.findIndex(key => key === old || key === '~' + old);
  const rest = index < 0 ? [] : keys.slice(index + 1);
  const temp = {[neo]: value};
  delete object[old];
  delete object['~' + old];
  insertKey(object, temp, rest);
}

export const NoThisSymbol = Symbol('aspromise.dont.bind.this')

export function asPromise<T extends (...args) => any>(func: T, args: Parameters<T>, thisParam: ThisParameterType<T> | symbol = NoThisSymbol): Promisify<ReturnType<T>> {
  return (async (...args) => await (this === NoThisSymbol ? func : func.bind(this))(...args)).apply(thisParam, args)
}
