import yaml from 'js-yaml';
import type { PageDefinition, ResourceDefinition } from '@/types';
import type { PageConfig } from './yaml-config';

export interface AppConfig {
  pages: PageDefinition[];
  resources: ResourceDefinition[];
}

// Load config from YAML files
export async function loadConfig(): Promise<AppConfig> {
  const [pagesConfig, resourcesConfig] = await Promise.all([
    loadYamlFile('/config/pages.yaml'),
    loadYamlFile('/config/resources.yaml'),
  ]);

  const pages = parsePages(pagesConfig);
  const resources = parseResources(resourcesConfig);

  return { pages, resources };
}

// Load individual YAML file
async function loadYamlFile(path: string): Promise<unknown> {
  try {
    const response = await fetch(path);
    if (!response.ok) {
      console.warn(`Failed to load ${path}: ${response.statusText}`);
      return null;
    }
    const text = await response.text();
    return yaml.load(text);
  } catch (error) {
    console.warn(`Error loading ${path}:`, error);
    return null;
  }
}

// Parse page config
function parsePages(config: unknown): PageDefinition[] {
  if (!config || typeof config !== 'object') return [];

  const data = config as { pages?: PageConfig[] };
  if (!data.pages || !Array.isArray(data.pages)) return [];

  return data.pages.map((page) => ({
    id: page.id,
    name: page.name,
    route: page.route,
    title: page.title,
    description: page.description,
    layout: page.layout,
    components: page.components?.map(parseComponent) || [],
  }));
}

// Parse component config
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function parseComponent(comp: any): PageDefinition['components'][0] {
  return {
    id: comp.id || '',
    type: (comp.type || 'container') as PageDefinition['components'][0]['type'],
    props: comp.props || {},
    children: comp.children?.map(parseComponent),
  };
}

// Parse resource config
function parseResources(config: unknown): ResourceDefinition[] {
  if (!config || typeof config !== 'object') return [];

  const data = config as { resources?: ResourceDefinition[] };
  if (!data.resources || !Array.isArray(data.resources)) return [];

  return data.resources;
}

// Config cache
let cachedConfig: AppConfig | null = null;

export async function getConfig(): Promise<AppConfig> {
  if (cachedConfig) return cachedConfig;
  cachedConfig = await loadConfig();
  return cachedConfig;
}

export function clearConfigCache(): void {
  cachedConfig = null;
}

// Get specific page config
export async function getPageConfig(route: string): Promise<PageDefinition | null> {
  const config = await getConfig();
  return config.pages.find((p) => matchRoute(p.route, route)) || null;
}

// Route matching (with parameter support)
export function matchRoute(pattern: string, path: string): boolean {
  const patternParts = pattern.split('/').filter(Boolean);
  const pathParts = path.split('/').filter(Boolean);

  if (patternParts.length !== pathParts.length) return false;

  return patternParts.every((part, i) => {
    if (part.startsWith(':')) return true; // parameter
    return part === pathParts[i];
  });
}

// Extract parameters from route
export function extractRouteParams(pattern: string, path: string): Record<string, string> {
  const params: Record<string, string> = {};
  const patternParts = pattern.split('/').filter(Boolean);
  const pathParts = path.split('/').filter(Boolean);

  patternParts.forEach((part, i) => {
    if (part.startsWith(':')) {
      params[part.slice(1)] = pathParts[i];
    }
  });

  return params;
}
