import React, { useState, useRef } from 'react';
import {
  Plus,
  Trash2,
  Languages,
  Save,
  Download,
  Upload,
  Code,
  Copy,
  Check,
  X,
  ChevronRight,
  Search,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
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
import { Separator } from '@/components/ui/separator';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

// Types for i18n management
interface LocaleData {
  [key: string]: string | LocaleData;
}

interface Locale {
  code: string;
  name: string;
  nativeName: string;
}

// Available locales
const AVAILABLE_LOCALES: Locale[] = [
  { code: 'en', name: 'English', nativeName: 'English' },
  { code: 'ko', name: 'Korean', nativeName: '한국어' },
  { code: 'ja', name: 'Japanese', nativeName: '日本語' },
  { code: 'zh', name: 'Chinese', nativeName: '中文' },
  { code: 'es', name: 'Spanish', nativeName: 'Español' },
  { code: 'fr', name: 'French', nativeName: 'Français' },
  { code: 'de', name: 'German', nativeName: 'Deutsch' },
];

// Default locale data structure
const DEFAULT_EN_LOCALE: LocaleData = {
  pages: {
    login: {
      title: 'Sign In',
      email: 'Email',
      password: 'Password',
      submit: 'Sign In',
      demo: 'Demo credentials',
    },
  },
  actions: {
    create: 'Create',
    edit: 'Edit',
    delete: 'Delete',
    save: 'Save',
    cancel: 'Cancel',
    close: 'Close',
    submit: 'Submit',
    search: 'Search',
    filter: 'Filter',
    export: 'Export',
    import: 'Import',
    refresh: 'Refresh',
  },
  table: {
    noData: 'No data available',
    loading: 'Loading...',
    rowsPerPage: 'Rows per page',
    of: 'of',
  },
  form: {
    required: 'This field is required',
    invalidEmail: 'Please enter a valid email address',
    minLength: 'Minimum {{count}} characters required',
  },
  auth: {
    logout: 'Log out',
    profile: 'Profile',
    settings: 'Settings',
  },
  navigation: {
    dashboard: 'Dashboard',
    users: 'Users',
    roles: 'Roles',
    builder: 'Builder',
    pageBuilder: 'Page Builder',
    resources: 'Resources',
    localization: 'Localization',
    settings: 'Settings',
    collapse: 'Collapse',
  },
  common: {
    loading: 'Loading...',
    error: 'An error occurred',
    retry: 'Retry',
    notFound: 'Page Not Found',
    notFoundDesc: 'The requested page does not exist.',
  },
};

// Flatten nested locale object to dot notation keys
const flattenLocale = (obj: LocaleData, prefix = ''): Record<string, string> => {
  const result: Record<string, string> = {};

  for (const key in obj) {
    const newKey = prefix ? `${prefix}.${key}` : key;
    const value = obj[key];

    if (typeof value === 'object' && value !== null) {
      Object.assign(result, flattenLocale(value as LocaleData, newKey));
    } else {
      result[newKey] = value as string;
    }
  }

  return result;
};

// Unflatten dot notation keys to nested object
const unflattenLocale = (obj: Record<string, string>): LocaleData => {
  const result: LocaleData = {};

  for (const key in obj) {
    const parts = key.split('.');
    let current: LocaleData = result;

    for (let i = 0; i < parts.length - 1; i++) {
      const part = parts[i];
      if (!(part in current)) {
        current[part] = {};
      }
      current = current[part] as LocaleData;
    }

    current[parts[parts.length - 1]] = obj[key];
  }

  return result;
};

// Get all unique keys from multiple locales
const getAllKeys = (locales: Record<string, LocaleData>): string[] => {
  const keys = new Set<string>();

  for (const locale in locales) {
    const flattened = flattenLocale(locales[locale]);
    for (const key in flattened) {
      keys.add(key);
    }
  }

  return Array.from(keys).sort();
};

// Group keys by their root namespace
const groupKeysByNamespace = (keys: string[]): Record<string, string[]> => {
  const groups: Record<string, string[]> = {};

  for (const key of keys) {
    const namespace = key.split('.')[0];
    if (!groups[namespace]) {
      groups[namespace] = [];
    }
    groups[namespace].push(key);
  }

  return groups;
};

export const LocalesManagerPage: React.FC = () => {
  // State for locale data
  const [locales, setLocales] = useState<Record<string, LocaleData>>({
    en: DEFAULT_EN_LOCALE,
    ko: {},
  });
  const [activeLocales, setActiveLocales] = useState<string[]>(['en', 'ko']);
  const [selectedNamespace, setSelectedNamespace] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [hasChanges, setHasChanges] = useState(false);
  const [copied, setCopied] = useState(false);

  // Dialog states
  const [addKeyDialogOpen, setAddKeyDialogOpen] = useState(false);
  const [addLocaleDialogOpen, setAddLocaleDialogOpen] = useState(false);
  const [jsonDialogOpen, setJsonDialogOpen] = useState(false);
  const [jsonContent, setJsonContent] = useState('');
  const [jsonLocale, setJsonLocale] = useState('en');
  const [jsonError, setJsonError] = useState<string | null>(null);

  // Edit states
  const [editingCell, setEditingCell] = useState<{ key: string; locale: string } | null>(null);
  const [editValue, setEditValue] = useState('');

  // New key form
  const [newKeyForm, setNewKeyForm] = useState({ key: '', values: {} as Record<string, string> });

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Get all translation keys
  const allKeys = getAllKeys(locales);
  const groupedKeys = groupKeysByNamespace(allKeys);
  const namespaces = Object.keys(groupedKeys).sort();

  // Filter keys
  const filteredKeys = allKeys.filter((key) => {
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      if (!key.toLowerCase().includes(query)) {
        // Also check values
        for (const locale of activeLocales) {
          const flattened = flattenLocale(locales[locale] || {});
          if (flattened[key]?.toLowerCase().includes(query)) {
            return true;
          }
        }
        return false;
      }
    }
    if (selectedNamespace) {
      return key.startsWith(selectedNamespace + '.');
    }
    return true;
  });

  // Get translation value for a key and locale
  const getTranslation = (key: string, locale: string): string => {
    const flattened = flattenLocale(locales[locale] || {});
    return flattened[key] || '';
  };

  // Set translation value
  const setTranslation = (key: string, locale: string, value: string) => {
    const flattened = flattenLocale(locales[locale] || {});
    flattened[key] = value;

    setLocales((prev) => ({
      ...prev,
      [locale]: unflattenLocale(flattened),
    }));
    setHasChanges(true);
  };

  // Delete a translation key
  const deleteKey = (key: string) => {
    const newLocales = { ...locales };

    for (const locale in newLocales) {
      const flattened = flattenLocale(newLocales[locale]);
      delete flattened[key];
      newLocales[locale] = unflattenLocale(flattened);
    }

    setLocales(newLocales);
    setHasChanges(true);
  };

  // Add a new translation key
  const handleAddKey = () => {
    if (!newKeyForm.key) return;

    const newLocales = { ...locales };

    for (const locale of activeLocales) {
      const flattened = flattenLocale(newLocales[locale] || {});
      flattened[newKeyForm.key] = newKeyForm.values[locale] || '';
      newLocales[locale] = unflattenLocale(flattened);
    }

    setLocales(newLocales);
    setHasChanges(true);
    setNewKeyForm({ key: '', values: {} });
    setAddKeyDialogOpen(false);
  };

  // Add a new locale
  const handleAddLocale = (localeCode: string) => {
    if (!activeLocales.includes(localeCode)) {
      setActiveLocales((prev) => [...prev, localeCode]);
      setLocales((prev) => ({
        ...prev,
        [localeCode]: {},
      }));
    }
    setAddLocaleDialogOpen(false);
  };

  // Remove a locale
  const handleRemoveLocale = (localeCode: string) => {
    if (localeCode === 'en') return; // Don't remove default locale

    setActiveLocales((prev) => prev.filter((l) => l !== localeCode));
    setLocales((prev) => {
      const newLocales = { ...prev };
      delete newLocales[localeCode];
      return newLocales;
    });
    setHasChanges(true);
  };

  // Start editing a cell
  const startEdit = (key: string, locale: string) => {
    setEditingCell({ key, locale });
    setEditValue(getTranslation(key, locale));
  };

  // Save edit
  const saveEdit = () => {
    if (editingCell) {
      setTranslation(editingCell.key, editingCell.locale, editValue);
      setEditingCell(null);
      setEditValue('');
    }
  };

  // Cancel edit
  const cancelEdit = () => {
    setEditingCell(null);
    setEditValue('');
  };

  // Export locale as JSON
  const handleExportJson = (locale: string) => {
    const json = JSON.stringify(locales[locale] || {}, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${locale}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // View JSON
  const handleViewJson = (locale: string) => {
    setJsonLocale(locale);
    setJsonContent(JSON.stringify(locales[locale] || {}, null, 2));
    setJsonError(null);
    setJsonDialogOpen(true);
  };

  // Apply JSON changes
  const handleApplyJson = () => {
    try {
      const parsed = JSON.parse(jsonContent);
      setLocales((prev) => ({
        ...prev,
        [jsonLocale]: parsed,
      }));
      setHasChanges(true);
      setJsonDialogOpen(false);
      setJsonError(null);
    } catch {
      setJsonError('Invalid JSON format');
    }
  };

  // Import JSON file
  const handleImportJson = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      const parsed = JSON.parse(text);

      // Extract locale code from filename (e.g., "ko.json" -> "ko")
      const localeCode = file.name.replace('.json', '');

      if (!activeLocales.includes(localeCode)) {
        setActiveLocales((prev) => [...prev, localeCode]);
      }

      setLocales((prev) => ({
        ...prev,
        [localeCode]: parsed,
      }));
      setHasChanges(true);
    } catch {
      setJsonError('Failed to parse JSON file');
      setJsonDialogOpen(true);
    }

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Copy JSON to clipboard
  const handleCopyJson = async () => {
    try {
      await navigator.clipboard.writeText(jsonContent);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback
      const textarea = document.createElement('textarea');
      textarea.value = jsonContent;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  // Get locale info
  const getLocaleInfo = (code: string): Locale => {
    return AVAILABLE_LOCALES.find((l) => l.code === code) || {
      code,
      name: code.toUpperCase(),
      nativeName: code.toUpperCase(),
    };
  };

  // Count missing translations
  const getMissingCount = (locale: string): number => {
    const flattened = flattenLocale(locales[locale] || {});
    return allKeys.filter((key) => !flattened[key]).length;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Localization</h1>
          <p className="text-muted-foreground">
            Manage translation keys and language files. Export as JSON for use with i18n providers.
          </p>
        </div>
        <div className="flex gap-2">
          <input
            ref={fileInputRef}
            type="file"
            accept=".json"
            onChange={handleImportJson}
            className="hidden"
          />
          <Button variant="outline" onClick={() => fileInputRef.current?.click()}>
            <Upload className="mr-2 h-4 w-4" />
            Import
          </Button>
          <Button variant="outline" onClick={() => setAddLocaleDialogOpen(true)}>
            <Languages className="mr-2 h-4 w-4" />
            Add Locale
          </Button>
          <Button onClick={() => setAddKeyDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Add Key
          </Button>
        </div>
      </div>

      {/* Changes notification */}
      {hasChanges && (
        <div className="flex items-center justify-between rounded-lg border border-amber-500 bg-amber-50 p-4 dark:bg-amber-950/20">
          <div className="flex items-center gap-2">
            <Save className="h-5 w-5 text-amber-600" />
            <span className="text-sm text-amber-800 dark:text-amber-200">
              You have unsaved changes. Export the locale files to save them.
            </span>
          </div>
          <div className="flex gap-2">
            {activeLocales.map((locale) => (
              <Button
                key={locale}
                size="sm"
                variant="outline"
                onClick={() => handleExportJson(locale)}
              >
                <Download className="mr-2 h-4 w-4" />
                {locale}.json
              </Button>
            ))}
          </div>
        </div>
      )}

      {/* Locale cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {activeLocales.map((localeCode) => {
          const info = getLocaleInfo(localeCode);
          const missingCount = getMissingCount(localeCode);
          const totalKeys = allKeys.length;
          const translatedCount = totalKeys - missingCount;
          const percentage = totalKeys > 0 ? Math.round((translatedCount / totalKeys) * 100) : 0;

          return (
            <Card key={localeCode}>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CardTitle className="text-base">{info.nativeName}</CardTitle>
                    <Badge variant="outline">{localeCode}</Badge>
                  </div>
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => handleViewJson(localeCode)}
                      title="View JSON"
                    >
                      <Code className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => handleExportJson(localeCode)}
                      title="Export"
                    >
                      <Download className="h-4 w-4" />
                    </Button>
                    {localeCode !== 'en' && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive"
                        onClick={() => handleRemoveLocale(localeCode)}
                        title="Remove"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
                <CardDescription>{info.name}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Progress</span>
                    <span className="font-medium">{percentage}%</span>
                  </div>
                  <div className="h-2 rounded-full bg-muted">
                    <div
                      className="h-2 rounded-full bg-primary transition-all"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {translatedCount} of {totalKeys} keys translated
                    {missingCount > 0 && (
                      <span className="text-destructive"> ({missingCount} missing)</span>
                    )}
                  </p>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Main content */}
      <div className="flex gap-6">
        {/* Namespace sidebar */}
        <div className="w-48 shrink-0">
          <div className="space-y-1">
            <Button
              variant={selectedNamespace === null ? 'secondary' : 'ghost'}
              className="w-full justify-start"
              onClick={() => setSelectedNamespace(null)}
            >
              All Keys
              <Badge variant="outline" className="ml-auto">
                {allKeys.length}
              </Badge>
            </Button>
            {namespaces.map((namespace) => (
              <Button
                key={namespace}
                variant={selectedNamespace === namespace ? 'secondary' : 'ghost'}
                className="w-full justify-start"
                onClick={() => setSelectedNamespace(namespace)}
              >
                <ChevronRight className="mr-2 h-4 w-4" />
                {namespace}
                <Badge variant="outline" className="ml-auto">
                  {groupedKeys[namespace].length}
                </Badge>
              </Button>
            ))}
          </div>
        </div>

        {/* Translation table */}
        <div className="flex-1 space-y-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search keys or values..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>

          {/* Table */}
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[300px]">Key</TableHead>
                  {activeLocales.map((locale) => (
                    <TableHead key={locale}>
                      {getLocaleInfo(locale).nativeName}
                    </TableHead>
                  ))}
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredKeys.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={activeLocales.length + 2}
                      className="h-24 text-center text-muted-foreground"
                    >
                      No translation keys found
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredKeys.map((key) => (
                    <TableRow key={key}>
                      <TableCell className="font-mono text-xs">{key}</TableCell>
                      {activeLocales.map((locale) => {
                        const value = getTranslation(key, locale);
                        const isEditing =
                          editingCell?.key === key && editingCell?.locale === locale;

                        return (
                          <TableCell
                            key={locale}
                            className="cursor-pointer hover:bg-muted/50"
                            onClick={() => !isEditing && startEdit(key, locale)}
                          >
                            {isEditing ? (
                              <div className="flex items-center gap-2">
                                <Input
                                  value={editValue}
                                  onChange={(e) => setEditValue(e.target.value)}
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter') saveEdit();
                                    if (e.key === 'Escape') cancelEdit();
                                  }}
                                  autoFocus
                                  className="h-8"
                                />
                                <Button size="icon" className="h-8 w-8" onClick={saveEdit}>
                                  <Check className="h-4 w-4" />
                                </Button>
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  className="h-8 w-8"
                                  onClick={cancelEdit}
                                >
                                  <X className="h-4 w-4" />
                                </Button>
                              </div>
                            ) : (
                              <span className={!value ? 'text-muted-foreground italic' : ''}>
                                {value || 'Click to add...'}
                              </span>
                            )}
                          </TableCell>
                        );
                      })}
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive"
                          onClick={() => deleteKey(key)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      </div>

      {/* Add Key Dialog */}
      <Dialog open={addKeyDialogOpen} onOpenChange={setAddKeyDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Translation Key</DialogTitle>
            <DialogDescription>
              Add a new translation key with values for each locale.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Key (dot notation)</Label>
              <Input
                placeholder="e.g., common.greeting"
                value={newKeyForm.key}
                onChange={(e) =>
                  setNewKeyForm((prev) => ({ ...prev, key: e.target.value }))
                }
              />
            </div>

            <Separator />

            {activeLocales.map((locale) => (
              <div key={locale} className="space-y-2">
                <Label>{getLocaleInfo(locale).nativeName}</Label>
                <Input
                  placeholder={`Translation in ${getLocaleInfo(locale).name}...`}
                  value={newKeyForm.values[locale] || ''}
                  onChange={(e) =>
                    setNewKeyForm((prev) => ({
                      ...prev,
                      values: { ...prev.values, [locale]: e.target.value },
                    }))
                  }
                />
              </div>
            ))}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setAddKeyDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddKey} disabled={!newKeyForm.key}>
              <Plus className="mr-2 h-4 w-4" />
              Add Key
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Locale Dialog */}
      <Dialog open={addLocaleDialogOpen} onOpenChange={setAddLocaleDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Locale</DialogTitle>
            <DialogDescription>
              Add a new language to your application.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-2 py-4">
            {AVAILABLE_LOCALES.filter((l) => !activeLocales.includes(l.code)).map((locale) => (
              <Button
                key={locale.code}
                variant="outline"
                className="justify-start"
                onClick={() => handleAddLocale(locale.code)}
              >
                <span className="font-medium">{locale.nativeName}</span>
                <span className="ml-2 text-muted-foreground">({locale.name})</span>
                <Badge variant="outline" className="ml-auto">
                  {locale.code}
                </Badge>
              </Button>
            ))}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setAddLocaleDialogOpen(false)}>
              Cancel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* JSON View/Edit Dialog */}
      <Dialog open={jsonDialogOpen} onOpenChange={setJsonDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle>
              JSON - {getLocaleInfo(jsonLocale).nativeName} ({jsonLocale})
            </DialogTitle>
            <DialogDescription>
              View and edit the locale file in JSON format.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {jsonError && (
              <div className="flex items-center gap-2 p-3 rounded-lg bg-destructive/10 text-destructive">
                <X className="h-4 w-4" />
                <span className="text-sm">{jsonError}</span>
              </div>
            )}

            <div className="flex items-center justify-between">
              <Label>JSON Content</Label>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={handleCopyJson}>
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
                  onClick={() => handleExportJson(jsonLocale)}
                >
                  <Download className="mr-2 h-4 w-4" />
                  Download
                </Button>
              </div>
            </div>

            <Textarea
              className="font-mono text-sm min-h-[400px]"
              value={jsonContent}
              onChange={(e) => {
                setJsonContent(e.target.value);
                setJsonError(null);
              }}
            />

            <p className="text-xs text-muted-foreground">
              Tip: Save this JSON file to{' '}
              <code className="px-1 py-0.5 rounded bg-muted">locales/{jsonLocale}.json</code> in
              your config directory.
            </p>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setJsonDialogOpen(false)}>
              Close
            </Button>
            <Button onClick={handleApplyJson}>
              <Save className="mr-2 h-4 w-4" />
              Apply
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default LocalesManagerPage;
