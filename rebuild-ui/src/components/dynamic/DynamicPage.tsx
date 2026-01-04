import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useOne, useList, useCreate, useUpdate, useDelete } from '@refinedev/core';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  ArrowLeft,
  Save,
  Edit,
  Trash2,
  Plus,
  Loader2,
  Users,
  ShoppingCart,
  DollarSign,
  TrendingUp,
  Package,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import type { PageDefinition, ComponentDefinition } from '@/types';

// Icon mapping
const iconMap: Record<string, React.ElementType> = {
  Users,
  ShoppingCart,
  DollarSign,
  TrendingUp,
  Package,
};

interface DynamicPageProps {
  page: PageDefinition;
}

export const DynamicPage: React.FC<DynamicPageProps> = ({ page }) => {
  const params = useParams();

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">{page.title}</h1>
        {page.description && (
          <p className="text-muted-foreground">{page.description}</p>
        )}
      </div>

      {/* Component rendering */}
      <div className="space-y-6">
        {page.components.map((component) => (
          <DynamicComponent
            key={component.id}
            component={component}
            params={params}
          />
        ))}
      </div>
    </div>
  );
};

interface DynamicComponentProps {
  component: ComponentDefinition;
  params: Record<string, string | undefined>;
}

const DynamicComponent: React.FC<DynamicComponentProps> = ({ component, params }) => {
  const { type, props, children } = component;

  switch (type) {
    case 'container':
      return (
        <div
          className={`flex ${
            props.direction === 'horizontal' ? 'flex-row' : 'flex-col'
          } gap-${props.gap || 4}`}
          style={{
            gap: `${props.gap || 16}px`,
            justifyContent: props.justify as string,
            alignItems: props.align as string,
          }}
        >
          {children?.map((child) => (
            <DynamicComponent key={child.id} component={child} params={params} />
          ))}
        </div>
      );

    case 'stat':
      return <StatComponent {...props} />;

    case 'card':
      return (
        <Card>
          <CardHeader>
            <CardTitle>{String(props.title || '')}</CardTitle>
            {props.description !== undefined && (
              <CardDescription>{String(props.description)}</CardDescription>
            )}
          </CardHeader>
          <CardContent>
            {props.resource && props.mode === 'show' ? (
              <ShowCard resource={String(props.resource)} id={params.id} fields={props.fields as Array<{name: string; label: string}>} />
            ) : (
              children?.map((child) => (
                <DynamicComponent key={child.id} component={child} params={params} />
              ))
            )}
          </CardContent>
        </Card>
      );

    case 'text':
      const level = props.level as string;
      if (level === 'h1') return <h1 className="text-3xl font-bold">{String(props.content)}</h1>;
      if (level === 'h2') return <h2 className="text-2xl font-semibold">{String(props.content)}</h2>;
      if (level === 'h3') return <h3 className="text-xl font-medium">{String(props.content)}</h3>;
      return <p>{String(props.content)}</p>;

    case 'button':
      return <ButtonComponent {...props} />;

    case 'table':
      return (
        <TableComponent
          resource={String(props.resource)}
          columns={props.columns as Array<{field: string; header: string}>}
          pageSize={Number(props.pageSize) || 10}
        />
      );

    case 'form':
      return (
        <FormComponent
          resource={String(props.resource)}
          mode={props.mode as 'create' | 'edit' | undefined}
          fields={props.fields as Array<{name: string; label: string; type: string; required?: boolean; options?: Array<{label: string; value: string}>}>}
          id={params.id}
          submitText={String(props.submitText || 'Save')}
          cancelText={String(props.cancelText || 'Cancel')}
          onCancelAction={String(props.onCancel || '')}
        />
      );

    case 'divider':
      return <Separator />;

    default:
      return (
        <div className="p-4 border rounded bg-muted/50">
          <p className="text-sm text-muted-foreground">
            Unknown component: {type}
          </p>
        </div>
      );
  }
};

// Stat component
const StatComponent: React.FC<Record<string, unknown>> = (props) => {
  const Icon = props.icon ? iconMap[String(props.icon)] : null;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{String(props.title)}</CardTitle>
        {Icon && <Icon className="h-4 w-4 text-muted-foreground" />}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{String(props.value)}</div>
        {props.trend !== undefined && (
          <p className="text-xs text-muted-foreground">
            <span className="text-green-600">{String(props.trend || '')}</span> vs last month
          </p>
        )}
      </CardContent>
    </Card>
  );
};

// Button component
const ButtonComponent: React.FC<Record<string, unknown>> = (props) => {
  const navigate = useNavigate();

  const handleClick = () => {
    if (props.action === 'navigate' && props.href) {
      navigate(String(props.href));
    }
  };

  return (
    <Button
      variant={(props.variant as 'default' | 'outline' | 'ghost') || 'default'}
      onClick={handleClick}
    >
      {props.icon === 'Plus' && <Plus className="mr-2 h-4 w-4" />}
      {String(props.text)}
    </Button>
  );
};

// Table component
const TableComponent: React.FC<{
  resource: string;
  columns: Array<{field: string; header: string}>;
  pageSize: number;
}> = ({ resource, columns, pageSize }) => {
  const navigate = useNavigate();
  const { query } = useList({
    resource,
    pagination: { pageSize },
  });

  const data = query.data?.data || [];
  const isLoading = query.isLoading;

  if (isLoading) {
    return (
      <div className="flex h-48 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <Card>
      <CardContent className="pt-6">
        <Table>
          <TableHeader>
            <TableRow>
              {columns.map((col) => (
                <TableHead key={col.field}>{col.header}</TableHead>
              ))}
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.map((row: Record<string, unknown>) => (
              <TableRow key={String(row.id)}>
                {columns.map((col) => (
                  <TableCell key={col.field}>
                    {col.field === 'status' ? (
                      <Badge variant={row[col.field] === 'active' ? 'default' : 'secondary'}>
                        {row[col.field] === 'active' ? 'Active' : 'Inactive'}
                      </Badge>
                    ) : col.field === 'role' ? (
                      <Badge variant="outline">
                        {row[col.field] === 'admin' ? 'Admin' : row[col.field] === 'editor' ? 'Editor' : 'Viewer'}
                      </Badge>
                    ) : (
                      String(row[col.field] || '')
                    )}
                  </TableCell>
                ))}
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => navigate(`/${resource}/show/${row.id}`)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => navigate(`/${resource}/edit/${row.id}`)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};

// Form component
const FormComponent: React.FC<{
  resource: string;
  mode?: 'create' | 'edit';
  fields: Array<{name: string; label: string; type: string; required?: boolean; options?: Array<{label: string; value: string}>}>;
  id?: string;
  submitText: string;
  cancelText: string;
  onCancelAction: string;
}> = ({ resource, mode = 'create', fields, id, submitText, cancelText, onCancelAction }) => {
  const navigate = useNavigate();
  const { mutate: createMutate, mutation: createMutation } = useCreate();
  const { mutate: updateMutate, mutation: updateMutation } = useUpdate();
  const { query } = useOne({ resource, id: id!, queryOptions: { enabled: !!id && mode === 'edit' } });

  const isLoading = mode === 'edit' ? query.isLoading : false;
  const isSaving = createMutation.status === 'pending' || updateMutation.status === 'pending';

  // Dynamic schema generation
  const schemaShape: Record<string, z.ZodTypeAny> = {};
  fields.forEach((field) => {
    let schema: z.ZodTypeAny;
    if (field.type === 'email') {
      schema = field.required
        ? z.string().min(1, `${field.label} is required`).email('Invalid email format')
        : z.string().email('Invalid email format').optional();
    } else if (field.type === 'number') {
      schema = field.required ? z.number() : z.number().optional();
    } else {
      schema = field.required
        ? z.string().min(1, `${field.label} is required`)
        : z.string().optional();
    }
    schemaShape[field.name] = schema;
  });
  const formSchema = z.object(schemaShape);

  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: query.data?.data || {},
  });

  React.useEffect(() => {
    if (query.data?.data) {
      Object.entries(query.data.data).forEach(([key, value]) => {
        form.setValue(key, value);
      });
    }
  }, [query.data, form]);

  const onSubmit = (data: Record<string, unknown>) => {
    if (mode === 'edit' && id) {
      updateMutate(
        { resource, id, values: data },
        { onSuccess: () => navigate(`/${resource}`) }
      );
    } else {
      createMutate(
        { resource, values: data },
        { onSuccess: () => navigate(`/${resource}`) }
      );
    }
  };

  const handleCancel = () => {
    if (onCancelAction.startsWith('navigate:')) {
      navigate(onCancelAction.replace('navigate:', ''));
    } else {
      navigate(-1);
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-48 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={handleCancel}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <CardTitle>{mode === 'edit' ? 'Edit' : 'Create'}</CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2">
            {fields.map((field) => (
              <div key={field.name} className="space-y-2">
                <Label htmlFor={field.name}>
                  {field.label} {field.required && '*'}
                </Label>
                {field.type === 'select' && field.options ? (
                  <Select
                    value={form.watch(field.name) as string}
                    onValueChange={(value) => form.setValue(field.name, value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={`Select ${field.label}`} />
                    </SelectTrigger>
                    <SelectContent>
                      {field.options.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>
                          {opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : field.type === 'textarea' ? (
                  <Textarea
                    id={field.name}
                    {...form.register(field.name)}
                  />
                ) : (
                  <Input
                    id={field.name}
                    type={field.type === 'email' ? 'email' : field.type === 'number' ? 'number' : 'text'}
                    {...form.register(field.name)}
                  />
                )}
                {form.formState.errors[field.name] && (
                  <p className="text-sm text-destructive">
                    {String(form.formState.errors[field.name]?.message)}
                  </p>
                )}
              </div>
            ))}
          </div>
          <div className="flex justify-end gap-4">
            <Button type="button" variant="outline" onClick={handleCancel}>
              {cancelText}
            </Button>
            <Button type="submit" disabled={isSaving}>
              {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              <Save className="mr-2 h-4 w-4" />
              {submitText}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};

// Show Card component
const ShowCard: React.FC<{
  resource: string;
  id?: string;
  fields: Array<{name: string; label: string}>;
}> = ({ resource, id, fields }) => {
  const navigate = useNavigate();
  const { query } = useOne({ resource, id: id! });
  const { mutate: deleteMutate } = useDelete();

  const data = query.data?.data;
  const isLoading = query.isLoading;

  const handleDelete = () => {
    deleteMutate(
      { resource, id: id! },
      { onSuccess: () => navigate(`/${resource}`) }
    );
  };

  if (isLoading) {
    return (
      <div className="flex h-48 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!data) {
    return <p className="text-muted-foreground">Data not found.</p>;
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2">
        {fields.map((field) => (
          <div key={field.name}>
            <Label className="text-muted-foreground">{field.label}</Label>
            <p className="mt-1">{String(data[field.name] || '-')}</p>
          </div>
        ))}
      </div>
      <div className="flex gap-2">
        <Button variant="outline" onClick={() => navigate(`/${resource}/edit/${id}`)}>
          <Edit className="mr-2 h-4 w-4" />
          Edit
        </Button>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="destructive">
              <Trash2 className="mr-2 h-4 w-4" />
              Delete
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you sure you want to delete?</AlertDialogTitle>
              <AlertDialogDescription>
                This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleDelete}>Delete</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
};

export default DynamicPage;
