import yaml from 'js-yaml';
import type { ResourceDefinition, PageDefinition, ComponentDefinition, ComponentType, LayoutType } from '@/types';

// YAML config file structure
export interface AdminBuilderConfig {
  version: string;
  resources: ResourceDefinition[];
  pages: PageConfig[];
}

export interface PageConfig {
  id: string;
  name: string;
  route: string;
  title: string;
  description?: string;
  layout?: LayoutType;
  components: ComponentConfig[];
}

export interface ComponentConfig {
  id: string;
  type: string;
  props: Record<string, unknown>;
  style?: Record<string, string | number>;
  children?: ComponentConfig[];
}

// Parse YAML and convert to config object
export function parseYamlConfig(yamlContent: string): AdminBuilderConfig {
  try {
    const config = yaml.load(yamlContent) as AdminBuilderConfig;
    return validateConfig(config);
  } catch (error) {
    throw new Error(`YAML parsing error: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

// Convert config object to YAML string
export function stringifyConfig(config: AdminBuilderConfig): string {
  return yaml.dump(config, {
    indent: 2,
    lineWidth: 120,
    noRefs: true,
    sortKeys: false,
  });
}

// Convert resource definition to YAML
export function resourceToYaml(resource: ResourceDefinition): string {
  return yaml.dump(resource, {
    indent: 2,
    lineWidth: 120,
    noRefs: true,
  });
}

// Convert multiple resources to YAML
export function resourcesToYaml(resources: ResourceDefinition[]): string {
  const config: Partial<AdminBuilderConfig> = {
    version: '1.0',
    resources,
  };
  return yaml.dump(config, {
    indent: 2,
    lineWidth: 120,
    noRefs: true,
  });
}

// Parse resource definitions from YAML
export function parseResourcesYaml(yamlContent: string): ResourceDefinition[] {
  try {
    const parsed = yaml.load(yamlContent) as { resources?: ResourceDefinition[] } | ResourceDefinition[];

    if (Array.isArray(parsed)) {
      return parsed;
    }

    if (parsed && typeof parsed === 'object' && 'resources' in parsed) {
      return parsed.resources || [];
    }

    throw new Error('Invalid resource YAML format');
  } catch (error) {
    throw new Error(`Resource YAML parsing error: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

// Convert page definition to YAML
export function pageToYaml(page: PageDefinition): string {
  const pageConfig: PageConfig = {
    id: page.id,
    name: page.name,
    route: page.route,
    title: page.title,
    description: page.description,
    layout: page.layout,
    components: page.components.map(componentToConfig),
  };

  return yaml.dump(pageConfig, {
    indent: 2,
    lineWidth: 120,
    noRefs: true,
  });
}

// Convert multiple pages to YAML
export function pagesToYaml(pages: PageDefinition[]): string {
  const config = {
    version: '1.0',
    pages: pages.map(page => ({
      id: page.id,
      name: page.name,
      route: page.route,
      title: page.title,
      description: page.description,
      layout: page.layout,
      components: page.components.map(componentToConfig),
    })),
  };

  return yaml.dump(config, {
    indent: 2,
    lineWidth: 120,
    noRefs: true,
  });
}

// Parse page definitions from YAML
export function parsePagesYaml(yamlContent: string): PageDefinition[] {
  try {
    const parsed = yaml.load(yamlContent) as { pages?: PageConfig[] } | PageConfig[];

    let pageConfigs: PageConfig[];

    if (Array.isArray(parsed)) {
      pageConfigs = parsed;
    } else if (parsed && typeof parsed === 'object' && 'pages' in parsed) {
      pageConfigs = parsed.pages || [];
    } else {
      throw new Error('Invalid page YAML format');
    }

    return pageConfigs.map(configToPage);
  } catch (error) {
    throw new Error(`Page YAML parsing error: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

// Convert ComponentDefinition to ComponentConfig
function componentToConfig(component: ComponentDefinition): ComponentConfig {
  return {
    id: component.id,
    type: component.type,
    props: component.props,
    style: component.style as Record<string, string | number> | undefined,
    children: component.children?.map(componentToConfig),
  };
}

// Convert ComponentConfig to ComponentDefinition
function configToComponent(config: ComponentConfig): ComponentDefinition {
  return {
    id: config.id,
    type: config.type as ComponentType,
    props: config.props,
    style: config.style as React.CSSProperties | undefined,
    children: config.children?.map(configToComponent),
  };
}

// Convert PageConfig to PageDefinition
function configToPage(config: PageConfig): PageDefinition {
  return {
    id: config.id,
    name: config.name,
    route: config.route,
    title: config.title,
    description: config.description,
    layout: config.layout,
    components: config.components.map(configToComponent),
  };
}

// Config validation
function validateConfig(config: AdminBuilderConfig): AdminBuilderConfig {
  if (!config.version) {
    config.version = '1.0';
  }

  if (!config.resources) {
    config.resources = [];
  }

  if (!config.pages) {
    config.pages = [];
  }

  // Resource validation
  config.resources.forEach((resource, index) => {
    if (!resource.name) {
      throw new Error(`Resource ${index + 1}: name field is required`);
    }
    if (!resource.label) {
      resource.label = resource.name;
    }
    if (!resource.endpoint) {
      resource.endpoint = `/${resource.name}`;
    }
    if (!resource.fields) {
      resource.fields = [];
    }
  });

  return config;
}

// Generate sample YAML config
export function generateSampleConfig(): string {
  const sampleConfig: AdminBuilderConfig = {
    version: '1.0',
    resources: [
      {
        name: 'users',
        label: 'User Management',
        endpoint: '/api/users',
        icon: 'Users',
        fields: [
          { name: 'id', label: 'ID', type: 'text', sortable: true },
          { name: 'name', label: 'Name', type: 'text', required: true, searchable: true },
          { name: 'email', label: 'Email', type: 'email', required: true, searchable: true },
          { name: 'role', label: 'Role', type: 'select', filterable: true, options: [
            { label: 'Admin', value: 'admin' },
            { label: 'Editor', value: 'editor' },
            { label: 'Viewer', value: 'viewer' },
          ]},
          { name: 'status', label: 'Status', type: 'select', filterable: true, options: [
            { label: 'Active', value: 'active' },
            { label: 'Inactive', value: 'inactive' },
          ]},
          { name: 'createdAt', label: 'Created At', type: 'datetime', sortable: true },
        ],
      },
    ],
    pages: [
      {
        id: 'dashboard',
        name: 'Dashboard',
        route: '/dashboard',
        title: 'Dashboard',
        description: 'View your service status at a glance',
        layout: 'default',
        components: [
          {
            id: 'stats-container',
            type: 'container',
            props: { direction: 'horizontal', gap: 16 },
            children: [
              {
                id: 'stat-users',
                type: 'stat',
                props: { title: 'Total Users', value: '12,847', prefix: '' },
              },
              {
                id: 'stat-orders',
                type: 'stat',
                props: { title: 'Orders This Month', value: '1,432' },
              },
            ],
          },
        ],
      },
    ],
  };

  return stringifyConfig(sampleConfig);
}

// File download helper
export function downloadYaml(content: string, filename: string): void {
  const blob = new Blob([content], { type: 'text/yaml;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename.endsWith('.yaml') ? filename : `${filename}.yaml`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

// File upload and parsing helper
export function readYamlFile(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result;
      if (typeof content === 'string') {
        resolve(content);
      } else {
        reject(new Error('Unable to read file'));
      }
    };
    reader.onerror = () => reject(new Error('File read error'));
    reader.readAsText(file);
  });
}
