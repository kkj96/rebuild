// Common type definitions

export interface BaseEntity {
  id: string | number;
  createdAt?: string;
  updatedAt?: string;
}

// User types
export interface User extends BaseEntity {
  email: string;
  name: string;
  role: UserRole;
  avatar?: string;
  status: 'active' | 'inactive';
}

export type UserRole = 'admin' | 'editor' | 'viewer';

// Resource definition types (for no-code builder)
export interface ResourceDefinition {
  name: string;
  label: string;
  icon?: string;
  endpoint: string;
  fields: FieldDefinition[];
  actions?: ActionDefinition[];
}

export interface FieldDefinition {
  name: string;
  label: string;
  type: FieldType;
  required?: boolean;
  sortable?: boolean;
  filterable?: boolean;
  searchable?: boolean;
  hidden?: boolean;
  defaultValue?: unknown;
  options?: SelectOption[];
  validation?: ValidationRule[];
  renderConfig?: RenderConfig;
}

export type FieldType =
  | 'text'
  | 'number'
  | 'email'
  | 'password'
  | 'textarea'
  | 'select'
  | 'multiselect'
  | 'checkbox'
  | 'radio'
  | 'date'
  | 'datetime'
  | 'time'
  | 'file'
  | 'image'
  | 'url'
  | 'json'
  | 'relation'
  | 'tag';

export interface SelectOption {
  label: string;
  value: string | number;
  color?: string;
}

export interface ValidationRule {
  type: 'required' | 'min' | 'max' | 'pattern' | 'email' | 'url' | 'custom';
  value?: unknown;
  message?: string;
}

export interface RenderConfig {
  width?: number | string;
  align?: 'left' | 'center' | 'right';
  format?: string;
  prefix?: string;
  suffix?: string;
}

export interface ActionDefinition {
  name: string;
  label: string;
  type: 'button' | 'link' | 'modal';
  icon?: string;
  confirm?: boolean;
  confirmMessage?: string;
  handler?: string;
}

// Page builder types
export interface PageDefinition {
  id: string;
  name: string;
  path?: string;
  route: string;
  title: string;
  description?: string;
  layout?: LayoutType;
  components: ComponentDefinition[];
}

export type LayoutType = 'default' | 'full' | 'sidebar' | 'centered';

export interface ComponentDefinition {
  id: string;
  type: ComponentType;
  props: Record<string, unknown>;
  children?: ComponentDefinition[];
  style?: React.CSSProperties;
}

export type ComponentType =
  | 'container'
  | 'card'
  | 'table'
  | 'form'
  | 'chart'
  | 'stat'
  | 'text'
  | 'button'
  | 'image'
  | 'divider'
  | 'tabs'
  | 'modal';

// API response types
export interface ApiResponse<T> {
  data: T;
  total?: number;
  page?: number;
  pageSize?: number;
}

// Filter and sort types
export interface FilterValue {
  field: string;
  operator: FilterOperator;
  value: unknown;
}

export type FilterOperator =
  | 'eq'
  | 'ne'
  | 'gt'
  | 'gte'
  | 'lt'
  | 'lte'
  | 'contains'
  | 'startsWith'
  | 'endsWith'
  | 'in'
  | 'nin';

export interface SortValue {
  field: string;
  order: 'asc' | 'desc';
}

// Theme settings
export type ThemeMode = 'light' | 'dark' | 'system';

export interface ThemeConfig {
  primaryColor: string;
  borderRadius: number;
  mode: ThemeMode;
}

// Auth context
export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}
