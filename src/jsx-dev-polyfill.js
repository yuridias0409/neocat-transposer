import { jsx, jsxs, Fragment } from 'react/jsx-runtime';

export function jsxDEV(type, props, key, isStaticChildren, source, self) {
  if (isStaticChildren) {
    return jsxs(type, props, key);
  }
  return jsx(type, props, key);
}
export { Fragment };
