import React, { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  Shield,
  Settings,
  Blocks,
  FileStack,
  Database,
  Languages,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { getAppSettings } from '@/lib/config-source';

interface NavItem {
  title: string;
  href?: string;
  icon: React.ComponentType<{ className?: string }>;
  children?: NavItem[];
}

const navItems: NavItem[] = [
  { title: 'Dashboard', href: '/', icon: LayoutDashboard },
  { title: 'Users', href: '/users', icon: Users },
  { title: 'Roles', href: '/roles', icon: Shield },
  {
    title: 'Builder',
    icon: Blocks,
    children: [
      { title: 'Page Builder', href: '/builder/pages', icon: FileStack },
      { title: 'Resources', href: '/builder/resources', icon: Database },
      { title: 'Localization', href: '/builder/locales', icon: Languages },
    ],
  },
  { title: 'Settings', href: '/settings', icon: Settings },
];

interface SidebarProps {
  collapsed?: boolean;
  onCollapse?: (collapsed: boolean) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ collapsed = false, onCollapse }) => {
  const location = useLocation();
  const [openMenus, setOpenMenus] = useState<string[]>(['Builder']);
  const appSettings = getAppSettings();

  const toggleMenu = (title: string) => {
    setOpenMenus((prev) =>
      prev.includes(title) ? prev.filter((t) => t !== title) : [...prev, title]
    );
  };

  const isActive = (href?: string) => {
    if (!href) return false;
    if (href === '/') return location.pathname === '/';
    return location.pathname.startsWith(href);
  };

  const renderNavItem = (item: NavItem, depth = 0) => {
    const hasChildren = item.children && item.children.length > 0;
    const isOpen = openMenus.includes(item.title);
    const active = isActive(item.href);
    const Icon = item.icon;

    if (hasChildren) {
      return (
        <div key={item.title}>
          <button
            onClick={() => toggleMenu(item.title)}
            className={cn(
              'flex w-full items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground',
              collapsed && 'justify-center px-2'
            )}
          >
            <Icon className="h-4 w-4 shrink-0" />
            {!collapsed && (
              <>
                <span className="flex-1 text-left text-sm">{item.title}</span>
                <ChevronDown
                  className={cn('h-4 w-4 transition-transform', isOpen && 'rotate-180')}
                />
              </>
            )}
          </button>
          {!collapsed && isOpen && (
            <div className="ml-4 mt-1 space-y-1 border-l pl-3">
              {item.children?.map((child) => renderNavItem(child, depth + 1))}
            </div>
          )}
        </div>
      );
    }

    const linkContent = (
      <NavLink
        to={item.href || '/'}
        className={cn(
          'flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground',
          active && 'bg-accent text-accent-foreground font-medium',
          collapsed && 'justify-center px-2'
        )}
      >
        <Icon className="h-4 w-4 shrink-0" />
        {!collapsed && <span className="text-sm">{item.title}</span>}
      </NavLink>
    );

    if (collapsed) {
      return (
        <Tooltip key={item.title} delayDuration={0}>
          <TooltipTrigger asChild>{linkContent}</TooltipTrigger>
          <TooltipContent side="right">{item.title}</TooltipContent>
        </Tooltip>
      );
    }

    return <div key={item.title}>{linkContent}</div>;
  };

  return (
    <TooltipProvider>
      <aside
        className={cn(
          'flex h-screen flex-col border-r bg-background transition-all duration-300',
          collapsed ? 'w-16' : 'w-64'
        )}
      >
        {/* Logo */}
        <div
          className={cn(
            'flex h-14 items-center border-b px-4',
            collapsed ? 'justify-center' : 'justify-between'
          )}
        >
          {!collapsed && (
            <div className="flex items-center gap-2">
              {appSettings.logo?.src && (
                <img
                  src={appSettings.logo.src}
                  alt={appSettings.logo.alt || appSettings.name}
                  width={appSettings.logo.width || 24}
                  height={appSettings.logo.height || 24}
                  className="shrink-0 dark:invert"
                />
              )}
              <span className="text-lg font-bold">{appSettings.name}</span>
            </div>
          )}
          {collapsed && (
            appSettings.logo?.src ? (
              <img
                src={appSettings.logo.src}
                alt={appSettings.logo.alt || appSettings.name}
                width={24}
                height={24}
                className="dark:invert"
              />
            ) : (
              <Blocks className="h-6 w-6" />
            )
          )}
        </div>

        {/* Navigation */}
        <ScrollArea className="flex-1 px-3 py-4">
          <nav className="space-y-1">{navItems.map((item) => renderNavItem(item))}</nav>
        </ScrollArea>

        {/* Collapse Button */}
        <div className="border-t p-3">
          <Button
            variant="ghost"
            size="sm"
            className="w-full"
            onClick={() => onCollapse?.(!collapsed)}
          >
            {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
            {!collapsed && <span className="ml-2">Collapse</span>}
          </Button>
        </div>
      </aside>
    </TooltipProvider>
  );
};
