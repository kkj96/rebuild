import React from 'react';
import {
  Table2,
  FormInput,
  BarChart3,
  Hash,
  Type,
  Image,
  Minus,
  PanelTop,
  Square,
  LayoutPanelLeft,
  Columns,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import type { ComponentType } from '@/types';

interface PaletteItem {
  type: ComponentType;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  description: string;
}

const paletteItems: PaletteItem[] = [
  {
    type: 'container',
    label: 'Container',
    icon: LayoutPanelLeft,
    description: 'Layout container for other components',
  },
  {
    type: 'card',
    label: 'Card',
    icon: Square,
    description: 'Card component for content',
  },
  {
    type: 'table',
    label: 'Table',
    icon: Table2,
    description: 'Data display table',
  },
  {
    type: 'form',
    label: 'Form',
    icon: FormInput,
    description: 'Data input form',
  },
  {
    type: 'chart',
    label: 'Chart',
    icon: BarChart3,
    description: 'Data visualization chart',
  },
  {
    type: 'stat',
    label: 'Stat',
    icon: Hash,
    description: 'Numeric statistics card',
  },
  {
    type: 'text',
    label: 'Text',
    icon: Type,
    description: 'Text block',
  },
  {
    type: 'image',
    label: 'Image',
    icon: Image,
    description: 'Image component',
  },
  {
    type: 'tabs',
    label: 'Tabs',
    icon: Columns,
    description: 'Tab navigation',
  },
  {
    type: 'modal',
    label: 'Modal',
    icon: PanelTop,
    description: 'Popup modal',
  },
  {
    type: 'divider',
    label: 'Divider',
    icon: Minus,
    description: 'Content divider',
  },
];

interface ComponentPaletteProps {
  onDragStart?: (type: ComponentType) => void;
  onSelect?: (type: ComponentType) => void;
}

export const ComponentPalette: React.FC<ComponentPaletteProps> = ({
  onDragStart,
  onSelect,
}) => {
  const handleDragStart = (e: React.DragEvent, type: ComponentType) => {
    e.dataTransfer.setData('componentType', type);
    e.dataTransfer.effectAllowed = 'copy';
    onDragStart?.(type);
  };

  return (
    <Card className="h-full">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium">Components</CardTitle>
      </CardHeader>
      <CardContent className="p-2">
        <ScrollArea className="h-[calc(100vh-16rem)]">
          <TooltipProvider delayDuration={0}>
            <div className="grid grid-cols-2 gap-2">
              {paletteItems.map((item) => {
                const Icon = item.icon;
                return (
                  <Tooltip key={item.type}>
                    <TooltipTrigger asChild>
                      <button
                        draggable
                        onDragStart={(e) => handleDragStart(e, item.type)}
                        onClick={() => onSelect?.(item.type)}
                        className={cn(
                          'flex flex-col items-center gap-1 rounded-lg border border-transparent bg-muted/50 p-3 text-center transition-colors hover:border-primary hover:bg-accent',
                          'cursor-grab active:cursor-grabbing'
                        )}
                      >
                        <Icon className="h-5 w-5 text-muted-foreground" />
                        <span className="text-xs">{item.label}</span>
                      </button>
                    </TooltipTrigger>
                    <TooltipContent side="right">
                      <p>{item.description}</p>
                    </TooltipContent>
                  </Tooltip>
                );
              })}
            </div>
          </TooltipProvider>
        </ScrollArea>
      </CardContent>
    </Card>
  );
};
