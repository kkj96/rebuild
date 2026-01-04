import yaml from 'js-yaml';
import type { PageDefinition, ResourceDefinition, ComponentDefinition, ComponentType } from '@/types';

// Config source type
export type ConfigSourceType = 'embedded' | 'local' | 'remote';

// App settings type
export interface AppSettings {
  name: string;
  title: string;
  description?: string;
  logo?: {
    src: string;
    alt?: string;
    width?: number;
    height?: number;
  };
  theme?: {
    primaryColor?: string;
    darkMode?: boolean;
  };
  sidebar?: {
    collapsed?: boolean;
    showLogo?: boolean;
  };
  footer?: {
    text?: string;
    showVersion?: boolean;
  };
}

// Route config type
export interface RouteConfig {
  path: string;
  type: 'code' | 'yaml';
  component?: string;
  file?: string;
  auth: boolean;
  layout: 'default' | 'none' | 'full';
}

export interface RoutesConfig {
  version: string;
  settings: {
    defaultLayout: string;
    authRequired: boolean;
    notFoundRedirect: string;
  };
  routes: RouteConfig[];
}

// Full app config
export interface AppConfig {
  routes: RoutesConfig;
  resources: ResourceDefinition[];
  pages: Map<string, PageDefinition>;
  app: AppSettings;
  source: ConfigSourceType;
}

// Config source environment variable
export function getConfigSource(): ConfigSourceType {
  const mode = import.meta.env.VITE_CONFIG_MODE as ConfigSourceType | undefined;
  return mode || 'embedded';
}

export function getConfigPath(): string {
  return import.meta.env.VITE_CONFIG_PATH || '/config';
}

// Default values
const DEFAULT_APP_SETTINGS: AppSettings = {
  name: 'Rebuild',
  title: 'Rebuild Admin',
  description: 'YAML-based no-code admin builder',
};

const DEFAULT_ROUTES_CONFIG: RoutesConfig = {
  version: '1.0',
  settings: {
    defaultLayout: 'default',
    authRequired: true,
    notFoundRedirect: '/',
  },
  routes: [],
};

// ============================================
// Embedded Mode (Build time - Vite glob)
// ============================================
const embeddedModules = import.meta.glob('/src/routes/**/*.yaml', {
  query: '?raw',
  import: 'default',
  eager: true,
}) as Record<string, string>;

function loadEmbeddedConfig(): AppConfig {
  const app = parseAppYaml(embeddedModules['/src/routes/_app.yaml']);
  const routes = parseRoutesYaml(embeddedModules['/src/routes/_routes.yaml']);
  const resources = parseResourcesYaml(embeddedModules['/src/routes/_resources.yaml']);
  const pages = new Map<string, PageDefinition>();

  Object.entries(embeddedModules).forEach(([path, content]) => {
    if (path.includes('_app.yaml') || path.includes('_routes.yaml') || path.includes('_resources.yaml')) {
      return;
    }
    const relativePath = path.replace('/src/routes/', '');
    try {
      pages.set(relativePath, parsePageYaml(content));
    } catch (error) {
      console.error(`Failed to parse ${path}:`, error);
    }
  });

  return { app, routes, resources, pages, source: 'embedded' };
}

// ============================================
// Local Mode (Runtime - fetch from public folder)
// ============================================
async function loadLocalConfig(): Promise<AppConfig> {
  const basePath = getConfigPath();

  const [appYaml, routesYaml, resourcesYaml, pagesIndex] = await Promise.all([
    fetchYaml(`${basePath}/_app.yaml`),
    fetchYaml(`${basePath}/_routes.yaml`),
    fetchYaml(`${basePath}/_resources.yaml`),
    fetchYaml(`${basePath}/_pages.yaml`), // Page index file
  ]);

  const app = parseAppYaml(appYaml);
  const routes = parseRoutesYaml(routesYaml);
  const resources = parseResourcesYaml(resourcesYaml);

  // Load individual pages from page index
  const pages = new Map<string, PageDefinition>();
  const pageFiles = parsePagesIndex(pagesIndex);

  await Promise.all(
    pageFiles.map(async (file) => {
      try {
        const pageYaml = await fetchYaml(`${basePath}/pages/${file}`);
        pages.set(file, parsePageYaml(pageYaml));
      } catch (error) {
        console.error(`Failed to load page ${file}:`, error);
      }
    })
  );

  return { app, routes, resources, pages, source: 'local' };
}

// ============================================
// Remote Mode (Runtime - fetch from API server)
// ============================================
async function loadRemoteConfig(): Promise<AppConfig> {
  const apiUrl = getConfigPath();

  try {
    const response = await fetch(`${apiUrl}/config`);
    if (!response.ok) {
      throw new Error(`Config API error: ${response.status}`);
    }

    const data = await response.json();

    return {
      app: data.app || DEFAULT_APP_SETTINGS,
      routes: data.routes || DEFAULT_ROUTES_CONFIG,
      resources: data.resources || [],
      pages: new Map(Object.entries(data.pages || {})),
      source: 'remote',
    };
  } catch (error) {
    console.error('Failed to load remote config:', error);
    // Fallback to embedded
    return loadEmbeddedConfig();
  }
}

// ============================================
// Parsing utilities
// ============================================
async function fetchYaml(url: string): Promise<string> {
  try {
    const response = await fetch(url);
    if (!response.ok) {
      console.warn(`Failed to fetch ${url}: ${response.status}`);
      return '';
    }
    return await response.text();
  } catch (error) {
    console.warn(`Failed to fetch ${url}:`, error);
    return '';
  }
}

function parseAppYaml(content: string | undefined): AppSettings {
  if (!content) return DEFAULT_APP_SETTINGS;
  try {
    const parsed = yaml.load(content) as { app?: AppSettings };
    return parsed?.app || DEFAULT_APP_SETTINGS;
  } catch {
    return DEFAULT_APP_SETTINGS;
  }
}

function parseRoutesYaml(content: string | undefined): RoutesConfig {
  if (!content) return DEFAULT_ROUTES_CONFIG;
  try {
    return yaml.load(content) as RoutesConfig;
  } catch {
    return DEFAULT_ROUTES_CONFIG;
  }
}

function parseResourcesYaml(content: string | undefined): ResourceDefinition[] {
  if (!content) return [];
  try {
    const parsed = yaml.load(content) as { resources?: ResourceDefinition[] };
    return parsed?.resources || [];
  } catch {
    return [];
  }
}

function parsePagesIndex(content: string | undefined): string[] {
  if (!content) return [];
  try {
    const parsed = yaml.load(content) as { pages?: string[] };
    return parsed?.pages || [];
  } catch {
    return [];
  }
}

function parsePageYaml(content: string): PageDefinition {
  const parsed = yaml.load(content) as {
    id: string;
    name: string;
    title: string;
    description?: string;
    layout?: string;
    components?: unknown[];
  };

  return {
    id: parsed.id,
    name: parsed.name,
    route: '',
    title: parsed.title,
    description: parsed.description,
    layout: parsed.layout as PageDefinition['layout'],
    components: (parsed.components || []).map(parseComponent),
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function parseComponent(comp: any): ComponentDefinition {
  return {
    id: comp.id || '',
    type: (comp.type || 'container') as ComponentType,
    props: comp.props || {},
    children: comp.children?.map(parseComponent),
  };
}

// ============================================
// Main loader
// ============================================
let cachedConfig: AppConfig | null = null;
let configPromise: Promise<AppConfig> | null = null;

// Sync load (embedded only, build time)
export function loadConfigSync(): AppConfig {
  if (cachedConfig) return cachedConfig;

  const source = getConfigSource();
  if (source !== 'embedded') {
    console.warn('loadConfigSync only works with embedded mode, falling back to embedded');
  }

  cachedConfig = loadEmbeddedConfig();
  return cachedConfig;
}

// Async load (supports all modes)
export async function loadConfig(): Promise<AppConfig> {
  if (cachedConfig) return cachedConfig;
  if (configPromise) return configPromise;

  const source = getConfigSource();

  configPromise = (async () => {
    switch (source) {
      case 'local':
        cachedConfig = await loadLocalConfig();
        break;
      case 'remote':
        cachedConfig = await loadRemoteConfig();
        break;
      case 'embedded':
      default:
        cachedConfig = loadEmbeddedConfig();
    }
    return cachedConfig;
  })();

  return configPromise;
}

// Clear cache
export function clearConfigCache(): void {
  cachedConfig = null;
  configPromise = null;
}

// Config getter (uses cached value)
export function getConfig(): AppConfig | null {
  return cachedConfig;
}

export function getAppSettings(): AppSettings {
  return cachedConfig?.app || DEFAULT_APP_SETTINGS;
}

export function getRoutes(): RoutesConfig {
  return cachedConfig?.routes || DEFAULT_ROUTES_CONFIG;
}

export function getResources(): ResourceDefinition[] {
  return cachedConfig?.resources || [];
}

export function getPages(): Map<string, PageDefinition> {
  return cachedConfig?.pages || new Map();
}

// Get page config for specific route
export function getPageForRoute(route: RouteConfig): PageDefinition | null {
  if (route.type !== 'yaml' || !route.file) return null;

  const pages = getPages();
  const page = pages.get(route.file);

  if (page) {
    return { ...page, route: route.path };
  }

  return null;
}

// Generate Refine resource definitions
export function getRefineResources() {
  const resources = getResources();

  return resources.map((r) => ({
    name: r.name,
    list: `/${r.name}`,
    create: `/${r.name}/create`,
    edit: `/${r.name}/edit/:id`,
    show: `/${r.name}/show/:id`,
    meta: {
      label: r.label,
      icon: r.icon,
    },
  }));
}

// Get specific resource definition
export function getResourceDefinition(name: string): ResourceDefinition | undefined {
  return getResources().find((r) => r.name === name);
}
