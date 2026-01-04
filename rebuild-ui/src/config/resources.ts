import type { ResourceDefinition } from '../types';

// Resource definitions
// Modify this file to add new resources

export const resourceDefinitions: ResourceDefinition[] = [
  {
    name: 'users',
    label: 'User Management',
    icon: 'UserOutlined',
    endpoint: '/users',
    fields: [
      {
        name: 'id',
        label: 'ID',
        type: 'text',
        sortable: true,
        hidden: false,
      },
      {
        name: 'name',
        label: 'Name',
        type: 'text',
        required: true,
        sortable: true,
        searchable: true,
      },
      {
        name: 'email',
        label: 'Email',
        type: 'email',
        required: true,
        sortable: true,
        searchable: true,
        validation: [{ type: 'email', message: 'Invalid email format' }],
      },
      {
        name: 'role',
        label: 'Role',
        type: 'select',
        required: true,
        filterable: true,
        options: [
          { label: 'Admin', value: 'admin', color: 'red' },
          { label: 'Editor', value: 'editor', color: 'blue' },
          { label: 'Viewer', value: 'viewer', color: 'green' },
        ],
      },
      {
        name: 'status',
        label: 'Status',
        type: 'select',
        required: true,
        filterable: true,
        defaultValue: 'active',
        options: [
          { label: 'Active', value: 'active', color: 'green' },
          { label: 'Inactive', value: 'inactive', color: 'gray' },
        ],
      },
      {
        name: 'createdAt',
        label: 'Created At',
        type: 'datetime',
        sortable: true,
        renderConfig: {
          format: 'YYYY-MM-DD HH:mm',
        },
      },
    ],
    actions: [
      {
        name: 'edit',
        label: 'Edit',
        type: 'link',
        icon: 'EditOutlined',
      },
      {
        name: 'delete',
        label: 'Delete',
        type: 'button',
        icon: 'DeleteOutlined',
        confirm: true,
        confirmMessage: 'Are you sure you want to delete?',
      },
    ],
  },
  {
    name: 'products',
    label: 'Product Management',
    icon: 'ShoppingOutlined',
    endpoint: '/products',
    fields: [
      {
        name: 'id',
        label: 'ID',
        type: 'text',
        sortable: true,
      },
      {
        name: 'name',
        label: 'Product Name',
        type: 'text',
        required: true,
        sortable: true,
        searchable: true,
      },
      {
        name: 'description',
        label: 'Description',
        type: 'textarea',
      },
      {
        name: 'price',
        label: 'Price',
        type: 'number',
        required: true,
        sortable: true,
        renderConfig: {
          prefix: '₩',
          format: '0,0',
        },
      },
      {
        name: 'category',
        label: 'Category',
        type: 'select',
        filterable: true,
        options: [
          { label: 'Electronics', value: 'electronics' },
          { label: 'Clothing', value: 'clothing' },
          { label: 'Food', value: 'food' },
          { label: 'Other', value: 'other' },
        ],
      },
      {
        name: 'status',
        label: 'Status',
        type: 'select',
        filterable: true,
        options: [
          { label: 'On Sale', value: 'active', color: 'green' },
          { label: 'Out of Stock', value: 'soldout', color: 'orange' },
          { label: 'Discontinued', value: 'inactive', color: 'gray' },
        ],
      },
      {
        name: 'stock',
        label: 'Stock',
        type: 'number',
        sortable: true,
      },
      {
        name: 'createdAt',
        label: 'Registered At',
        type: 'datetime',
        sortable: true,
      },
    ],
    actions: [
      {
        name: 'edit',
        label: 'Edit',
        type: 'link',
        icon: 'EditOutlined',
      },
      {
        name: 'delete',
        label: 'Delete',
        type: 'button',
        icon: 'DeleteOutlined',
        confirm: true,
        confirmMessage: 'Are you sure you want to delete?',
      },
    ],
  },
  {
    name: 'orders',
    label: 'Order Management',
    icon: 'ShoppingCartOutlined',
    endpoint: '/orders',
    fields: [
      {
        name: 'id',
        label: 'Order Number',
        type: 'text',
        sortable: true,
      },
      {
        name: 'customerName',
        label: 'Customer Name',
        type: 'text',
        searchable: true,
      },
      {
        name: 'customerEmail',
        label: 'Email',
        type: 'email',
        searchable: true,
      },
      {
        name: 'totalAmount',
        label: 'Total Amount',
        type: 'number',
        sortable: true,
        renderConfig: {
          prefix: '₩',
          format: '0,0',
        },
      },
      {
        name: 'status',
        label: 'Status',
        type: 'select',
        filterable: true,
        options: [
          { label: 'Pending', value: 'pending', color: 'orange' },
          { label: 'Processing', value: 'processing', color: 'blue' },
          { label: 'Shipping', value: 'shipping', color: 'cyan' },
          { label: 'Completed', value: 'completed', color: 'green' },
          { label: 'Cancelled', value: 'cancelled', color: 'red' },
        ],
      },
      {
        name: 'createdAt',
        label: 'Order Date',
        type: 'datetime',
        sortable: true,
      },
    ],
    actions: [
      {
        name: 'view',
        label: 'Details',
        type: 'link',
        icon: 'EyeOutlined',
      },
      {
        name: 'edit',
        label: 'Edit',
        type: 'link',
        icon: 'EditOutlined',
      },
    ],
  },
];

// Find definition by resource name
export const getResourceDefinition = (name: string): ResourceDefinition | undefined => {
  return resourceDefinitions.find((r) => r.name === name);
};

// Convert to Refine resource format
export const getRefineResources = () => {
  return resourceDefinitions.map((resource) => ({
    name: resource.name,
    list: `/${resource.name}`,
    create: `/${resource.name}/create`,
    edit: `/${resource.name}/edit/:id`,
    show: `/${resource.name}/show/:id`,
    meta: {
      label: resource.label,
      icon: resource.icon,
    },
  }));
};
