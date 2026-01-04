import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { useBuilderStore } from '@/store';
import type { ComponentDefinition } from '@/types';

interface PropertyConfig {
  name: string;
  label: string;
  type: 'text' | 'number' | 'select' | 'switch' | 'textarea' | 'color';
  options?: { label: string; value: string }[];
}

// Component type property definitions
const componentProperties: Record<string, PropertyConfig[]> = {
  container: [
    {
      name: 'direction',
      label: 'Direction',
      type: 'select',
      options: [
        { label: 'Horizontal', value: 'horizontal' },
        { label: 'Vertical', value: 'vertical' },
      ],
    },
    { name: 'gap', label: 'Gap (px)', type: 'number' },
    { name: 'padding', label: 'Padding (px)', type: 'number' },
  ],
  card: [
    { name: 'title', label: 'Title', type: 'text' },
    { name: 'description', label: 'Description', type: 'text' },
    { name: 'bordered', label: 'Border', type: 'switch' },
  ],
  table: [
    { name: 'resource', label: 'Resource', type: 'text' },
    { name: 'pageSize', label: 'Page Size', type: 'number' },
  ],
  form: [
    { name: 'resource', label: 'Resource', type: 'text' },
    {
      name: 'layout',
      label: 'Layout',
      type: 'select',
      options: [
        { label: 'Vertical', value: 'vertical' },
        { label: 'Horizontal', value: 'horizontal' },
      ],
    },
  ],
  chart: [
    {
      name: 'chartType',
      label: 'Chart Type',
      type: 'select',
      options: [
        { label: 'Line', value: 'line' },
        { label: 'Bar', value: 'bar' },
        { label: 'Pie', value: 'pie' },
        { label: 'Donut', value: 'donut' },
      ],
    },
    { name: 'title', label: 'Title', type: 'text' },
    { name: 'dataSource', label: 'Data Source', type: 'text' },
  ],
  stat: [
    { name: 'title', label: 'Title', type: 'text' },
    { name: 'value', label: 'Value', type: 'text' },
    { name: 'prefix', label: 'Prefix', type: 'text' },
    { name: 'suffix', label: 'Suffix', type: 'text' },
  ],
  text: [
    { name: 'content', label: 'Content', type: 'textarea' },
    {
      name: 'level',
      label: 'Level',
      type: 'select',
      options: [
        { label: 'Text', value: 'text' },
        { label: 'Heading 1', value: 'h1' },
        { label: 'Heading 2', value: 'h2' },
        { label: 'Heading 3', value: 'h3' },
      ],
    },
  ],
  image: [
    { name: 'src', label: 'Image URL', type: 'text' },
    { name: 'alt', label: 'Alt Text', type: 'text' },
    { name: 'width', label: 'Width', type: 'number' },
    { name: 'height', label: 'Height', type: 'number' },
  ],
  button: [
    { name: 'text', label: 'Text', type: 'text' },
    {
      name: 'variant',
      label: 'Style',
      type: 'select',
      options: [
        { label: 'Default', value: 'default' },
        { label: 'Primary', value: 'primary' },
        { label: 'Outline', value: 'outline' },
        { label: 'Ghost', value: 'ghost' },
      ],
    },
  ],
  tabs: [
    { name: 'defaultValue', label: 'Default Tab', type: 'text' },
  ],
  modal: [
    { name: 'title', label: 'Title', type: 'text' },
    { name: 'description', label: 'Description', type: 'text' },
  ],
  divider: [],
};

// Style properties
const styleProperties: PropertyConfig[] = [
  { name: 'width', label: 'Width', type: 'text' },
  { name: 'height', label: 'Height', type: 'text' },
  { name: 'margin', label: 'Margin', type: 'text' },
  { name: 'padding', label: 'Padding', type: 'text' },
  { name: 'backgroundColor', label: 'Background Color', type: 'color' },
];

interface PropertyPanelProps {
  component: ComponentDefinition | null;
}

export const PropertyPanel: React.FC<PropertyPanelProps> = ({ component }) => {
  const { updateComponent } = useBuilderStore();
  const { register, watch, setValue, reset } = useForm();

  useEffect(() => {
    if (component) {
      reset({
        ...component.props,
        ...component.style,
      });
    }
  }, [component, reset]);

  useEffect(() => {
    if (!component) return;

    const subscription = watch((values) => {
      const props: Record<string, unknown> = {};
      const style: Record<string, unknown> = {};

      const styleKeys = styleProperties.map((p) => p.name);
      Object.entries(values).forEach(([key, value]) => {
        if (value !== undefined && value !== '') {
          if (styleKeys.includes(key)) {
            style[key] = value;
          } else {
            props[key] = value;
          }
        }
      });

      updateComponent(component.id, { props, style: style as React.CSSProperties });
    });

    return () => subscription.unsubscribe();
  }, [component, watch, updateComponent]);

  if (!component) {
    return (
      <Card className="h-full">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium">Properties</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">Select a component</p>
        </CardContent>
      </Card>
    );
  }

  const properties = componentProperties[component.type] || [];

  const renderInput = (prop: PropertyConfig) => {
    switch (prop.type) {
      case 'text':
        return <Input {...register(prop.name)} placeholder={prop.label} />;
      case 'textarea':
        return <Textarea {...register(prop.name)} placeholder={prop.label} rows={3} />;
      case 'number':
        return (
          <Input
            type="number"
            {...register(prop.name, { valueAsNumber: true })}
            placeholder={prop.label}
          />
        );
      case 'select':
        return (
          <Select
            value={watch(prop.name) || ''}
            onValueChange={(value) => setValue(prop.name, value)}
          >
            <SelectTrigger>
              <SelectValue placeholder={prop.label} />
            </SelectTrigger>
            <SelectContent>
              {prop.options?.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        );
      case 'switch':
        return (
          <Switch
            checked={watch(prop.name) || false}
            onCheckedChange={(checked) => setValue(prop.name, checked)}
          />
        );
      case 'color':
        return (
          <Input
            type="color"
            {...register(prop.name)}
            className="h-9 w-full cursor-pointer p-1"
          />
        );
      default:
        return <Input {...register(prop.name)} />;
    }
  };

  return (
    <Card className="h-full">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium">Properties</CardTitle>
        <p className="text-xs text-muted-foreground">
          Component: <span className="font-medium">{component.type}</span>
        </p>
      </CardHeader>
      <CardContent className="p-2">
        <ScrollArea className="h-[calc(100vh-16rem)]">
          <div className="space-y-4 p-2">
            {properties.length > 0 && (
              <>
                <p className="text-xs font-medium text-muted-foreground">Component Properties</p>
                {properties.map((prop) => (
                  <div key={prop.name} className="space-y-1.5">
                    <Label className="text-xs">{prop.label}</Label>
                    {renderInput(prop)}
                  </div>
                ))}
              </>
            )}

            <Separator className="my-4" />

            <p className="text-xs font-medium text-muted-foreground">Styles</p>
            {styleProperties.map((prop) => (
              <div key={prop.name} className="space-y-1.5">
                <Label className="text-xs">{prop.label}</Label>
                {renderInput(prop)}
              </div>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
};
