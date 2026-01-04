import React, { useCallback, useState, useRef } from 'react';
import { nanoid } from 'nanoid';
import {
  Save,
  Eye,
  Undo,
  Redo,
  Plus,
  Download,
  Upload,
  Code,
  Copy,
  Check,
  X,
  ArrowLeft,
  Trash2,
  Edit3,
  FileText,
  MoreVertical,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ComponentPalette, PropertyPanel, CanvasRenderer } from '@/components/builder';
import { useBuilderStore } from '@/store';
import type { ComponentType, ComponentDefinition, PageDefinition } from '@/types';
import {
  pageToYaml,
  pagesToYaml,
  parsePagesYaml,
  downloadYaml,
  readYamlFile,
} from '@/lib/yaml-config';

export const PageBuilderPage: React.FC = () => {
  const {
    currentPage,
    selectedComponent,
    savedPages,
    setCurrentPage,
    selectComponent,
    addComponent,
    savePage,
    loadPage,
  } = useBuilderStore();

  const [yamlDialogOpen, setYamlDialogOpen] = useState(false);
  const [yamlContent, setYamlContent] = useState('');
  const [yamlError, setYamlError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [pagesDialogOpen, setPagesDialogOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Create new page
  const createNewPage = () => {
    const newPage: PageDefinition = {
      id: nanoid(),
      name: 'New Page',
      route: '/new-page',
      title: 'New Page',
      description: '',
      layout: 'default',
      components: [],
    };
    setCurrentPage(newPage);
  };

  // Add component
  const handleAddComponent = useCallback(
    (type: ComponentType) => {
      if (!currentPage) {
        createNewPage();
      }

      const newComponent: ComponentDefinition = {
        id: nanoid(),
        type,
        props: getDefaultProps(type),
        children: type === 'container' || type === 'card' ? [] : undefined,
      };

      addComponent(newComponent);
      selectComponent(newComponent.id);
    },
    [currentPage, addComponent, selectComponent]
  );

  // Drop handler
  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      const componentType = e.dataTransfer.getData('componentType') as ComponentType;
      if (componentType) {
        handleAddComponent(componentType);
      }
    },
    [handleAddComponent]
  );

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
  };

  // Find selected component
  const findSelectedComponent = (
    components: ComponentDefinition[]
  ): ComponentDefinition | null => {
    for (const comp of components) {
      if (comp.id === selectedComponent) return comp;
      if (comp.children) {
        const found = findSelectedComponent(comp.children);
        if (found) return found;
      }
    }
    return null;
  };

  const selectedComp = currentPage
    ? findSelectedComponent(currentPage.components)
    : null;

  // YAML functions
  const handleViewYaml = () => {
    if (currentPage) {
      setYamlContent(pageToYaml(currentPage));
    } else {
      setYamlContent('# No page found. Please create a new page.');
    }
    setYamlError(null);
    setYamlDialogOpen(true);
  };

  const handleExportYaml = () => {
    if (currentPage) {
      downloadYaml(pageToYaml(currentPage), `page-${currentPage.id}.yaml`);
    }
  };

  const handleExportAllYaml = () => {
    const allPages = currentPage
      ? savedPages.some((p) => p.id === currentPage.id)
        ? savedPages
        : [...savedPages, currentPage]
      : savedPages;

    if (allPages.length > 0) {
      downloadYaml(pagesToYaml(allPages), 'pages.yaml');
    }
  };

  const handleImportYaml = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const content = await readYamlFile(file);
      const pages = parsePagesYaml(content);

      if (pages.length > 0) {
        setCurrentPage(pages[0]);
      }

      setYamlError(null);
    } catch (error) {
      setYamlError(error instanceof Error ? error.message : 'Failed to read YAML file');
      setYamlDialogOpen(true);
    }

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleApplyYaml = () => {
    try {
      const pages = parsePagesYaml(yamlContent);

      if (pages.length > 0) {
        setCurrentPage(pages[0]);
      }

      setYamlDialogOpen(false);
      setYamlError(null);
    } catch (error) {
      setYamlError(error instanceof Error ? error.message : 'YAML parsing error');
    }
  };

  const handleCopyYaml = async () => {
    try {
      await navigator.clipboard.writeText(yamlContent);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      const textarea = document.createElement('textarea');
      textarea.value = yamlContent;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="flex h-[calc(100vh-8rem)] flex-col">
      {/* Toolbar */}
      <div className="flex items-center justify-between border-b bg-background px-4 py-2">
        <div className="flex items-center gap-4">
          <h1 className="text-lg font-semibold">Page Builder</h1>
          {currentPage && (
            <>
              <Separator orientation="vertical" className="h-6" />
              <Input
                value={currentPage.name}
                onChange={(e) =>
                  setCurrentPage({ ...currentPage, name: e.target.value })
                }
                className="h-8 w-48"
                placeholder="Page name"
              />
              <Input
                value={currentPage.route}
                onChange={(e) =>
                  setCurrentPage({ ...currentPage, route: e.target.value })
                }
                className="h-8 w-32 font-mono text-xs"
                placeholder="/route"
              />
            </>
          )}
        </div>
        <div className="flex items-center gap-2">
          <input
            ref={fileInputRef}
            type="file"
            accept=".yaml,.yml"
            onChange={handleImportYaml}
            className="hidden"
          />

          {/* Page management dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <FolderOpen className="mr-2 h-4 w-4" />
                Pages
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={createNewPage}>
                <Plus className="mr-2 h-4 w-4" />
                New Page
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setPagesDialogOpen(true)}>
                <FileText className="mr-2 h-4 w-4" />
                Saved Pages ({savedPages.length})
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => fileInputRef.current?.click()}>
                <Upload className="mr-2 h-4 w-4" />
                Import YAML
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleExportAllYaml} disabled={savedPages.length === 0 && !currentPage}>
                <Download className="mr-2 h-4 w-4" />
                Export All YAML
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <Separator orientation="vertical" className="h-6" />

          <Button variant="ghost" size="icon" disabled>
            <Undo className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" disabled>
            <Redo className="h-4 w-4" />
          </Button>

          <Separator orientation="vertical" className="h-6" />

          <Button variant="outline" size="sm" onClick={handleViewYaml} disabled={!currentPage}>
            <Code className="mr-2 h-4 w-4" />
            YAML
          </Button>
          <Button variant="outline" size="sm">
            <Eye className="mr-2 h-4 w-4" />
            Preview
          </Button>
          <Button size="sm" onClick={savePage} disabled={!currentPage}>
            <Save className="mr-2 h-4 w-4" />
            Save
          </Button>
        </div>
      </div>

      {/* Main area */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left panel - Component palette */}
        <div className="w-60 border-r p-2">
          <ComponentPalette onSelect={handleAddComponent} />
        </div>

        {/* Center - Canvas */}
        <div
          className="flex-1 overflow-auto bg-muted/30 p-6"
          onDrop={handleDrop}
          onDragOver={handleDragOver}
        >
          {currentPage ? (
            <CanvasRenderer
              components={currentPage.components}
              selectedId={selectedComponent}
              onSelect={selectComponent}
              isEditing={true}
            />
          ) : (
            <div className="flex h-full items-center justify-center">
              <div className="text-center">
                <h3 className="text-lg font-medium">No page found</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  Create a new page or import a YAML file
                </p>
                <div className="mt-4 flex justify-center gap-2">
                  <Button onClick={createNewPage}>
                    <Plus className="mr-2 h-4 w-4" />
                    Create New Page
                  </Button>
                  <Button variant="outline" onClick={() => fileInputRef.current?.click()}>
                    <Upload className="mr-2 h-4 w-4" />
                    Import YAML
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right panel - Properties */}
        <div className="w-72 border-l p-2">
          <PropertyPanel component={selectedComp} />
        </div>
      </div>

      {/* YAML dialog */}
      <Dialog open={yamlDialogOpen} onOpenChange={setYamlDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle>Page YAML Configuration</DialogTitle>
            <DialogDescription>
              View and edit page configuration in YAML format. Can be version controlled with Git.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {yamlError && (
              <div className="flex items-center gap-2 p-3 rounded-lg bg-destructive/10 text-destructive">
                <X className="h-4 w-4" />
                <span className="text-sm">{yamlError}</span>
              </div>
            )}

            <div className="flex items-center justify-between">
              <Label>YAML Content</Label>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={handleCopyYaml}>
                  {copied ? (
                    <Check className="mr-2 h-4 w-4" />
                  ) : (
                    <Copy className="mr-2 h-4 w-4" />
                  )}
                  {copied ? 'Copied' : 'Copy'}
                </Button>
                <Button variant="outline" size="sm" onClick={handleExportYaml} disabled={!currentPage}>
                  <Download className="mr-2 h-4 w-4" />
                  Download
                </Button>
              </div>
            </div>

            <Textarea
              className="font-mono text-sm min-h-[400px]"
              value={yamlContent}
              onChange={(e) => {
                setYamlContent(e.target.value);
                setYamlError(null);
              }}
              placeholder="Enter YAML content..."
            />

            <p className="text-xs text-muted-foreground">
              Tip: Save this YAML file to the <code className="px-1 py-0.5 rounded bg-muted">config/pages/</code> folder in your project for Git version control.
            </p>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setYamlDialogOpen(false)}>
              Close
            </Button>
            <Button onClick={handleApplyYaml}>
              <Save className="mr-2 h-4 w-4" />
              Apply
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Saved pages list dialog */}
      <Dialog open={pagesDialogOpen} onOpenChange={setPagesDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Saved Pages</DialogTitle>
            <DialogDescription>
              List of saved pages. Click to load.
            </DialogDescription>
          </DialogHeader>

          <ScrollArea className="max-h-[400px]">
            {savedPages.length > 0 ? (
              <div className="space-y-2">
                {savedPages.map((page) => (
                  <div
                    key={page.id}
                    className="flex items-center justify-between p-3 rounded-lg border cursor-pointer hover:bg-muted/50 transition-colors"
                    onClick={() => {
                      loadPage(page.id);
                      setPagesDialogOpen(false);
                    }}
                  >
                    <div>
                      <p className="font-medium">{page.name}</p>
                      <p className="text-sm text-muted-foreground font-mono">{page.route}</p>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {page.components.length} components
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                No saved pages
              </div>
            )}
          </ScrollArea>

          <DialogFooter>
            <Button variant="outline" onClick={() => setPagesDialogOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

// Default props for component types
function getDefaultProps(type: ComponentType): Record<string, unknown> {
  switch (type) {
    case 'container':
      return { direction: 'vertical', gap: 16, padding: 16 };
    case 'card':
      return { title: 'Card Title', bordered: true };
    case 'table':
      return { resource: '', pageSize: 10 };
    case 'form':
      return { resource: '', layout: 'vertical' };
    case 'chart':
      return { chartType: 'line', title: 'Chart' };
    case 'stat':
      return { title: 'Statistics', value: '0' };
    case 'text':
      return { content: 'Enter text here', level: 'text' };
    case 'image':
      return { src: '', alt: 'Image' };
    case 'button':
      return { text: 'Button', variant: 'default' };
    case 'tabs':
      return { defaultValue: 'tab1' };
    case 'modal':
      return { title: 'Modal' };
    case 'divider':
      return {};
    default:
      return {};
  }
}

export default PageBuilderPage;
