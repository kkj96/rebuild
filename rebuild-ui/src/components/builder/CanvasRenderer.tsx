import React from 'react';
import { Trash2, GripVertical } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { useBuilderStore } from '@/store';
import type { ComponentDefinition } from '@/types';

interface CanvasRendererProps {
  components: ComponentDefinition[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  isEditing?: boolean;
}

interface ComponentRendererProps {
  component: ComponentDefinition;
  isSelected: boolean;
  onSelect: () => void;
  isEditing: boolean;
}

const ComponentRenderer: React.FC<ComponentRendererProps> = ({
  component,
  isSelected,
  onSelect,
  isEditing,
}) => {
  const { removeComponent } = useBuilderStore();
  const { props, style } = component;

  const wrapperStyle: React.CSSProperties = {
    position: 'relative',
    ...style,
  };

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onSelect();
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    removeComponent(component.id);
  };

  const renderComponent = () => {
    switch (component.type) {
      case 'container':
        return (
          <div
            className={cn(
              'min-h-[100px] rounded-lg border-2 border-dashed p-4',
              isEditing ? 'border-muted-foreground/25 bg-muted/30' : 'border-transparent'
            )}
            style={{
              display: 'flex',
              flexDirection: props.direction === 'horizontal' ? 'row' : 'column',
              gap: props.gap ? `${props.gap}px` : '16px',
              padding: props.padding ? `${props.padding}px` : '16px',
            }}
          >
            {component.children?.length ? (
              component.children.map((child) => (
                <ComponentRenderer
                  key={child.id}
                  component={child}
                  isSelected={false}
                  onSelect={onSelect}
                  isEditing={isEditing}
                />
              ))
            ) : isEditing ? (
              <p className="text-sm text-muted-foreground">
                Drag components here to add
              </p>
            ) : null}
          </div>
        );

      case 'card':
        return (
          <Card>
            <CardHeader>
              <CardTitle>{String(props.title || 'Card Title')}</CardTitle>
              {props.description ? <CardDescription>{String(props.description)}</CardDescription> : null}
            </CardHeader>
            <CardContent>
              {component.children?.map((child) => (
                <ComponentRenderer
                  key={child.id}
                  component={child}
                  isSelected={false}
                  onSelect={onSelect}
                  isEditing={isEditing}
                />
              )) ?? (isEditing ? (
                <p className="text-sm text-muted-foreground">Card content</p>
              ) : null)}
            </CardContent>
          </Card>
        );

      case 'table':
        return (
          <Card>
            <CardContent className="pt-6">
              <div className="rounded-md border">
                <div className="grid grid-cols-4 border-b bg-muted/50 p-3 font-medium">
                  <span>Column 1</span>
                  <span>Column 2</span>
                  <span>Column 3</span>
                  <span>Column 4</span>
                </div>
                {[1, 2, 3].map((row) => (
                  <div key={row} className="grid grid-cols-4 border-b p-3 last:border-0">
                    <span className="text-muted-foreground">Data {row}-1</span>
                    <span className="text-muted-foreground">Data {row}-2</span>
                    <span className="text-muted-foreground">Data {row}-3</span>
                    <span className="text-muted-foreground">Data {row}-4</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        );

      case 'form':
        return (
          <Card>
            <CardContent className="space-y-4 pt-6">
              <div className="space-y-2">
                <label className="text-sm font-medium">Field 1</label>
                <Input placeholder="Enter value" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Field 2</label>
                <Input placeholder="Enter value" />
              </div>
              <Button>Submit</Button>
            </CardContent>
          </Card>
        );

      case 'chart':
        return (
          <Card>
            <CardHeader>
              <CardTitle>{String(props.title || 'Chart')}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex h-48 items-center justify-center rounded-lg bg-muted">
                <span className="text-muted-foreground">
                  {String(props.chartType || 'line')} chart area
                </span>
              </div>
            </CardContent>
          </Card>
        );

      case 'stat':
        return (
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>{String(props.title || 'Statistics')}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {props.prefix ? String(props.prefix) : ''}
                {props.value ? String(props.value) : '0'}
                {props.suffix ? String(props.suffix) : ''}
              </div>
            </CardContent>
          </Card>
        );

      case 'text':
        const textContent = String(props.content || 'Enter text here');
        switch (props.level) {
          case 'h1':
            return <h1 className="text-4xl font-bold">{textContent}</h1>;
          case 'h2':
            return <h2 className="text-3xl font-semibold">{textContent}</h2>;
          case 'h3':
            return <h3 className="text-2xl font-medium">{textContent}</h3>;
          default:
            return <p className="text-base">{textContent}</p>;
        }

      case 'image':
        return (
          <img
            src={String(props.src || 'https://via.placeholder.com/300x200')}
            alt={String(props.alt || 'Image')}
            className="rounded-lg object-cover"
            style={{
              width: props.width ? `${props.width}px` : 'auto',
              height: props.height ? `${props.height}px` : 'auto',
            }}
          />
        );

      case 'tabs':
        return (
          <Tabs defaultValue="tab1" className="w-full">
            <TabsList>
              <TabsTrigger value="tab1">Tab 1</TabsTrigger>
              <TabsTrigger value="tab2">Tab 2</TabsTrigger>
              <TabsTrigger value="tab3">Tab 3</TabsTrigger>
            </TabsList>
            <TabsContent value="tab1" className="p-4">
              Tab 1 content
            </TabsContent>
            <TabsContent value="tab2" className="p-4">
              Tab 2 content
            </TabsContent>
            <TabsContent value="tab3" className="p-4">
              Tab 3 content
            </TabsContent>
          </Tabs>
        );

      case 'modal':
        return (
          <Card>
            <CardHeader>
              <CardTitle>{String(props.title || 'Modal')}</CardTitle>
              {props.description ? <CardDescription>{String(props.description)}</CardDescription> : null}
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">Modal component (preview)</p>
            </CardContent>
          </Card>
        );

      case 'divider':
        return <Separator className="my-4" />;

      case 'button':
        return (
          <Button variant={(props.variant as 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link') || 'default'}>
            {String(props.text || 'Button')}
          </Button>
        );

      default:
        return (
          <div className="rounded-lg border border-dashed p-4 text-muted-foreground">
            Unknown component: {component.type}
          </div>
        );
    }
  };

  return (
    <div
      className={cn(
        'relative rounded-lg transition-all',
        isEditing && 'cursor-pointer',
        isEditing && !isSelected && 'hover:ring-2 hover:ring-muted-foreground/25',
        isSelected && 'ring-2 ring-primary'
      )}
      style={wrapperStyle}
      onClick={handleClick}
    >
      {isEditing && isSelected && (
        <div className="absolute -top-8 right-0 z-10 flex gap-1 rounded-md bg-primary p-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 cursor-grab text-primary-foreground hover:bg-primary/80"
          >
            <GripVertical className="h-3 w-3" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 text-primary-foreground hover:bg-destructive"
            onClick={handleDelete}
          >
            <Trash2 className="h-3 w-3" />
          </Button>
        </div>
      )}
      {renderComponent()}
    </div>
  );
};

export const CanvasRenderer: React.FC<CanvasRendererProps> = ({
  components,
  selectedId,
  onSelect,
  isEditing = true,
}) => {
  return (
    <div
      className={cn(
        'min-h-[400px] rounded-lg p-4',
        isEditing && 'border-2 border-dashed border-muted-foreground/25 bg-muted/10'
      )}
    >
      {components.length > 0 ? (
        <div className="space-y-4">
          {components.map((component) => (
            <ComponentRenderer
              key={component.id}
              component={component}
              isSelected={selectedId === component.id}
              onSelect={() => onSelect(component.id)}
              isEditing={isEditing}
            />
          ))}
        </div>
      ) : (
        <div className="flex h-60 items-center justify-center">
          <p className="text-muted-foreground">
            {isEditing ? 'Drag components here to add' : 'No components'}
          </p>
        </div>
      )}
    </div>
  );
};
