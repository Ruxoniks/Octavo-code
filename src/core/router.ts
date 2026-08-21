type RouteHandler = (params: Record<string, string>) => void;

interface Route {
  pattern: RegExp;
  keys: string[];
  handler: RouteHandler;
}

/**
 * Простейший hash-роутер: #/ , #/task/:id , #/settings.
 * Hash выбран специально — статическая сборка работает с любого хостинга,
 * включая GitHub Pages и открытие из подпапки.
 */
const routes: Route[] = [];
let fallback: RouteHandler = () => {};

export function route(path: string, handler: RouteHandler): void {
  const keys: string[] = [];
  const pattern = new RegExp(
    '^' +
      path.replace(/:[a-zA-Z]+/g, (m) => {
        keys.push(m.slice(1));
        return '([^/]+)';
      }) +
      '$',
  );
  routes.push({ pattern, keys, handler });
}

export function notFound(handler: RouteHandler): void {
  fallback = handler;
}

export function navigate(path: string): void {
  if (location.hash === `#${path}`) {
    resolve();
    return;
  }
  location.hash = path;
}

export function currentPath(): string {
  const hash = location.hash.replace(/^#/, '');
  return hash || '/';
}

export function resolve(): void {
  const path = currentPath();
  for (const r of routes) {
    const match = path.match(r.pattern);
    if (match) {
      const params: Record<string, string> = {};
      r.keys.forEach((key, i) => (params[key] = decodeURIComponent(match[i + 1])));
      r.handler(params);
      return;
    }
  }
  fallback({});
}

export function startRouter(): void {
  window.addEventListener('hashchange', resolve);
  resolve();
}
