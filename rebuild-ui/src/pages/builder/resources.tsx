import React, { useState, useRef } from 'react';
import {
  Plus,
  Edit,
  Trash2,
  Database,
  Save,
  Download,
  Upload,
  Eye,
  Code,
  Copy,
  Check,
  FileCode,
  X,
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import type { ResourceDefinition, FieldDefinition, FieldType } from '@/types';
import {
  resourceToYaml,
  resourcesToYaml,
  parseResourcesYaml,
  downloadYaml,
  readYamlFile,
} from '@/lib/yaml-config';
import { getResources } from '@/lib/config-source';

const fieldTypes: { label: string; value: FieldType }[] = [
  { label: 'Text', value: 'text' },
  { label: 'Number', value: 'number' },
  { label: 'Email', value: 'email' },
  { label: 'Password', value: 'password' },
  { label: 'Textarea', value: 'textarea' },
  { label: 'Select', value: 'select' },
  { label: 'Multi-select', value: 'multiselect' },
  { label: 'Checkbox', value: 'checkbox' },
  { label: 'Radio', value: 'radio' },
  { label: 'Date', value: 'date' },
  { label: 'Datetime', value: 'datetime' },
  { label: 'Time', value: 'time' },
  { label: 'File', value: 'file' },
  { label: 'Image', value: 'image' },
  { label: 'URL', value: 'url' },
  { label: 'JSON', value: 'json' },
  { label: 'Relation', value: 'relation' },
  { label: 'Tag', value: 'tag' },
];

type DialogMode = 'create' | 'edit' | 'view';

export const ResourceManagerPage: React.FC = () => {
  // Resource management based on YAML files (edit in local state, save to YAML file)
  const [resources, setResources] = useState<ResourceDefinition[]>(() => getResources());
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogMode, setDialogMode] = useState<DialogMode>('create');
  const [selectedResource, setSelectedResource] = useState<ResourceDefinition | null>(null);
  const [newField, setNewField] = useState<Partial<FieldDefinition>>({});
  const [yamlDialogOpen, setYamlDialogOpen] = useState(false);
  const [yamlContent, setYamlContent] = useState('');
  const [yamlError, setYamlError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const allResources = resources;

  const [formData, setFormData] = useState<Partial<ResourceDefinition>>({
    name: '',
    label: '',
    endpoint: '',
    fields: [],
  });

  const resetForm = () => {
    setFormData({ name: '', label: '', endpoint: '', fields: [] });
    setNewField({});
    setSelectedResource(null);
  };

  const openCreateDialog = () => {
    resetForm();
    setDialogMode('create');
    setDialogOpen(true);
  };

  const openViewDialog = (resource: ResourceDefinition) => {
    setSelectedResource(resource);
    setFormData({ ...resource });
    setDialogMode('view');
    setDialogOpen(true);
  };

  const openEditDialog = (resource: ResourceDefinition) => {
    setSelectedResource(resource);
    setFormData({ ...resource, fields: [...resource.fields] });
    setDialogMode('edit');
    setDialogOpen(true);
  };

  const handleAddField = () => {
    if (!newField.name || !newField.type) return;

    const field: FieldDefinition = {
      name: newField.name,
      label: newField.label || newField.name,
      type: newField.type as FieldType,
      required: newField.required,
      sortable: newField.sortable,
      searchable: newField.searchable,
      filterable: newField.filterable,
    };

    setFormData((prev) => ({
      ...prev,
      fields: [...(prev.fields || []), field],
    }));

    setNewField({});
  };

  const handleRemoveField = (fieldName: string) => {
    setFormData((prev) => ({
      ...prev,
      fields: prev.fields?.filter((f) => f.name !== fieldName) || [],
    }));
  };

  const handleSaveResource = () => {
    if (!formData.name || !formData.label || !formData.endpoint) return;

    const resource: ResourceDefinition = {
      name: formData.name,
      label: formData.label,
      endpoint: formData.endpoint,
      fields: formData.fields || [],
      icon: formData.icon || 'Database',
    };

    if (dialogMode === 'edit' && selectedResource) {
      // Update existing resource
      setResources((prev) =>
        prev.map((r) => (r.name === selectedResource.name ? resource : r))
      );
    } else {
      // Add new resource
      setResources((prev) => [...prev, resource]);
    }

    setHasChanges(true);
    resetForm();
    setDialogOpen(false);
  };

  const handleDeleteResource = (name: string) => {
    setResources((prev) => prev.filter((r) => r.name !== name));
    setHasChanges(true);
  };

  // YAML functions
  const handleExportYaml = (resource?: ResourceDefinition) => {
    if (resource) {
      const yaml = resourceToYaml(resource);
      downloadYaml(yaml, `resource-${resource.name}.yaml`);
    } else {
      const yaml = resourcesToYaml(allResources);
      downloadYaml(yaml, 'resources.yaml');
    }
  };

  const handleViewYaml = (resource?: ResourceDefinition) => {
    if (resource) {
      setYamlContent(resourceToYaml(resource));
    } else {
      setYamlContent(resourcesToYaml(allResources));
    }
    setYamlError(null);
    setYamlDialogOpen(true);
  };

  const handleImportYaml = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const content = await readYamlFile(file);
      const importedResources = parseResourcesYaml(content);
      setResources(importedResources);
      setHasChanges(true);
      setYamlError(null);
    } catch (error) {
      setYamlError(error instanceof Error ? error.message : 'Failed to read YAML file');
      setYamlDialogOpen(true);
    }

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleApplyYaml = () => {
    try {
      const parsedResources = parseResourcesYaml(yamlContent);
      setResources(parsedResources);
      setHasChanges(true);
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
      // Fallback
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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Resource Manager</h1>
          <p className="text-muted-foreground">
            Define and manage data resources. Import/export as YAML.
          </p>
        </div>
        <div className="flex gap-2">
          <input
            ref={fileInputRef}
            type="file"
            accept=".yaml,.yml"
            onChange={handleImportYaml}
            className="hidden"
          />
          <Button variant="outline" onClick={() => handleViewYaml()}>
            <Code className="mr-2 h-4 w-4" />
            View YAML
          </Button>
          <Button variant="outline" onClick={() => fileInputRef.current?.click()}>
            <Upload className="mr-2 h-4 w-4" />
            Import
          </Button>
          <Button variant="outline" onClick={() => handleExportYaml()}>
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
          <Button onClick={openCreateDialog}>
            <Plus className="mr-2 h-4 w-4" />
            Add Resource
          </Button>
        </div>
      </div>

      {/* Changes notification */}
      {hasChanges && (
        <div className="flex items-center justify-between rounded-lg border border-amber-500 bg-amber-50 p-4 dark:bg-amber-950/20">
          <div className="flex items-center gap-2">
            <Save className="h-5 w-5 text-amber-600" />
            <span className="text-sm text-amber-800 dark:text-amber-200">
              You have unsaved changes. Download the YAML file and save it to <code className="px-1 py-0.5 rounded bg-amber-100 dark:bg-amber-900">src/routes/_resources.yaml</code>.
            </span>
          </div>
          <Button size="sm" onClick={() => handleExportYaml()}>
            <Download className="mr-2 h-4 w-4" />
            Download
          </Button>
        </div>
      )}

      {/* Resource card list */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {allResources.map((resource) => (
          <Card
            key={resource.name}
            className="cursor-pointer transition-shadow hover:shadow-md"
            onClick={() => openViewDialog(resource)}
          >
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Database className="h-5 w-5 text-muted-foreground" />
                  <CardTitle className="text-base">{resource.label}</CardTitle>
                </div>
                <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => handleViewYaml(resource)}
                    title="View YAML"
                  >
                    <FileCode className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => openEditDialog(resource)}
                    title="Edit"
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-destructive"
                    onClick={() => handleDeleteResource(resource.name)}
                    title="Delete"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <CardDescription className="font-mono text-xs">
                {resource.endpoint}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-1">
                {resource.fields.slice(0, 5).map((field) => (
                  <Badge key={field.name} variant="outline" className="text-xs">
                    {field.label}
                  </Badge>
                ))}
                {resource.fields.length > 5 && (
                  <Badge variant="secondary" className="text-xs">
                    +{resource.fields.length - 5}
                  </Badge>
                )}
              </div>
              <p className="mt-3 text-xs text-muted-foreground">
                {resource.fields.length} fields
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Resource create/edit/view dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle>
              {dialogMode === 'create' && 'Add New Resource'}
              {dialogMode === 'edit' && 'Edit Resource'}
              {dialogMode === 'view' && `Resource: ${selectedResource?.label}`}
            </DialogTitle>
            <DialogDescription>
              {dialogMode === 'create' && 'Define a new data resource.'}
              {dialogMode === 'edit' && 'Modify resource information.'}
              {dialogMode === 'view' && 'View resource details.'}
            </DialogDescription>
          </DialogHeader>

          <Tabs defaultValue="form" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="form">
                <Eye className="mr-2 h-4 w-4" />
                {dialogMode === 'view' ? 'Details' : 'Form Editor'}
              </TabsTrigger>
              <TabsTrigger value="yaml">
                <Code className="mr-2 h-4 w-4" />
                YAML
              </TabsTrigger>
            </TabsList>

            <TabsContent value="form">
              <ScrollArea className="max-h-[55vh] pr-4">
                <div className="space-y-6 py-4">
                  {/* Basic Info */}
                  <div className="space-y-4">
                    <h4 className="font-medium">Basic Information</h4>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Resource Name</Label>
                        <Input
                          placeholder="users"
                          value={formData.name}
                          onChange={(e) =>
                            setFormData((prev) => ({ ...prev, name: e.target.value }))
                          }
                          disabled={dialogMode === 'view'}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Display Label</Label>
                        <Input
                          placeholder="User Management"
                          value={formData.label}
                          onChange={(e) =>
                            setFormData((prev) => ({ ...prev, label: e.target.value }))
                          }
                          disabled={dialogMode === 'view'}
                        />
                      </div>
                      <div className="col-span-2 space-y-2">
                        <Label>API Endpoint</Label>
                        <Input
                          placeholder="/api/users"
                          value={formData.endpoint}
                          onChange={(e) =>
                            setFormData((prev) => ({ ...prev, endpoint: e.target.value }))
                          }
                          disabled={dialogMode === 'view'}
                        />
                      </div>
                    </div>
                  </div>

                  <Separator />

                  {/* Field list */}
                  <div className="space-y-4">
                    <h4 className="font-medium">
                      Field Definitions ({formData.fields?.length || 0})
                    </h4>

                    {formData.fields && formData.fields.length > 0 && (
                      <div className="space-y-2">
                        {formData.fields.map((field) => (
                          <div
                            key={field.name}
                            className="flex items-center justify-between rounded-lg border p-3"
                          >
                            <div className="flex items-center gap-3">
                              <div>
                                <span className="font-medium">{field.label}</span>
                                <span className="ml-2 font-mono text-xs text-muted-foreground">
                                  ({field.name})
                                </span>
                              </div>
                              <Badge variant="outline">{field.type}</Badge>
                              {field.required && <Badge variant="secondary">Required</Badge>}
                              {field.sortable && (
                                <Badge variant="outline" className="text-xs">
                                  Sortable
                                </Badge>
                              )}
                              {field.searchable && (
                                <Badge variant="outline" className="text-xs">
                                  Searchable
                                </Badge>
                              )}
                              {field.filterable && (
                                <Badge variant="outline" className="text-xs">
                                  Filterable
                                </Badge>
                              )}
                            </div>
                            {dialogMode !== 'view' && (
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleRemoveField(field.name)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Add new field form (only when not in view mode) */}
                    {dialogMode !== 'view' && (
                      <div className="rounded-lg border p-4 space-y-4">
                        <div className="grid grid-cols-3 gap-4">
                          <div className="space-y-2">
                            <Label>Field Name</Label>
                            <Input
                              placeholder="name"
                              value={newField.name || ''}
                              onChange={(e) =>
                                setNewField((prev) => ({ ...prev, name: e.target.value }))
                              }
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>Display Label</Label>
                            <Input
                              placeholder="Name"
                              value={newField.label || ''}
                              onChange={(e) =>
                                setNewField((prev) => ({ ...prev, label: e.target.value }))
                              }
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>Type</Label>
                            <Select
                              value={newField.type}
                              onValueChange={(value) =>
                                setNewField((prev) => ({ ...prev, type: value as FieldType }))
                              }
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Select" />
                              </SelectTrigger>
                              <SelectContent>
                                {fieldTypes.map((type) => (
                                  <SelectItem key={type.value} value={type.value}>
                                    {type.label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                        <div className="flex items-center gap-6">
                          <div className="flex items-center gap-2">
                            <Switch
                              checked={newField.required || false}
                              onCheckedChange={(checked) =>
                                setNewField((prev) => ({ ...prev, required: checked }))
                              }
                            />
                            <Label>Required</Label>
                          </div>
                          <div className="flex items-center gap-2">
                            <Switch
                              checked={newField.sortable || false}
                              onCheckedChange={(checked) =>
                                setNewField((prev) => ({ ...prev, sortable: checked }))
                              }
                            />
                            <Label>Sortable</Label>
                          </div>
                          <div className="flex items-center gap-2">
                            <Switch
                              checked={newField.searchable || false}
                              onCheckedChange={(checked) =>
                                setNewField((prev) => ({ ...prev, searchable: checked }))
                              }
                            />
                            <Label>Searchable</Label>
                          </div>
                          <div className="flex items-center gap-2">
                            <Switch
                              checked={newField.filterable || false}
                              onCheckedChange={(checked) =>
                                setNewField((prev) => ({ ...prev, filterable: checked }))
                              }
                            />
                            <Label>Filterable</Label>
                          </div>
                        </div>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={handleAddField}
                          disabled={!newField.name || !newField.type}
                        >
                          <Plus className="mr-2 h-4 w-4" />
                          Add Field
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              </ScrollArea>
            </TabsContent>

            <TabsContent value="yaml">
              <div className="space-y-4 py-4">
                <div className="flex items-center justify-between">
                  <Label>YAML Configuration</Label>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        if (formData.name && formData.label && formData.endpoint) {
                          const resource: ResourceDefinition = {
                            name: formData.name,
                            label: formData.label,
                            endpoint: formData.endpoint,
                            fields: formData.fields || [],
                            icon: formData.icon || 'Database',
                          };
                          downloadYaml(resourceToYaml(resource), `resource-${resource.name}.yaml`);
                        }
                      }}
                      disabled={!formData.name}
                    >
                      <Download className="mr-2 h-4 w-4" />
                      Download
                    </Button>
                  </div>
                </div>
                <Textarea
                  className="font-mono text-sm min-h-[300px]"
                  value={
                    formData.name && formData.label && formData.endpoint
                      ? resourceToYaml({
                          name: formData.name,
                          label: formData.label,
                          endpoint: formData.endpoint,
                          fields: formData.fields || [],
                          icon: formData.icon || 'Database',
                        })
                      : '# YAML will be generated when resource info is entered'
                  }
                  readOnly
                />
              </div>
            </TabsContent>
          </Tabs>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              {dialogMode === 'view' ? 'Close' : 'Cancel'}
            </Button>
            {dialogMode === 'view' && selectedResource && (
              <Button
                variant="outline"
                onClick={() => {
                  setDialogMode('edit');
                }}
              >
                <Edit className="mr-2 h-4 w-4" />
                Edit
              </Button>
            )}
            {dialogMode !== 'view' && (
              <Button onClick={handleSaveResource}>
                <Save className="mr-2 h-4 w-4" />
                Save
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* YAML view/edit dialog */}
      <Dialog open={yamlDialogOpen} onOpenChange={setYamlDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle>YAML Configuration</DialogTitle>
            <DialogDescription>
              View and edit resource configuration in YAML format. Can be version controlled with Git.
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
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => downloadYaml(yamlContent, 'resources.yaml')}
                >
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
              Tip: Save this YAML file to the <code className="px-1 py-0.5 rounded bg-muted">config/</code> folder in your project for Git version control.
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
    </div>
  );
};

export default ResourceManagerPage;
