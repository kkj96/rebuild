import React, { useEffect, useState } from 'react';
import { Refine, Authenticated } from '@refinedev/core';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import routerBindings from '@refinedev/react-router';

import { dataProvider, authProvider, accessControlProvider } from '@/providers';
import { MainLayout } from '@/components/layout';
import { DynamicPage } from '@/components/dynamic';
import { LoginPage } from '@/pages/auth';
import { PageBuilderPage, ResourceManagerPage, LocalesManagerPage } from '@/pages/builder';
import { SettingsPage } from '@/pages/settings';
import {
  loadConfig,
  loadConfigSync,
  getConfigSource,
  getRefineResources,
  getPageForRoute,
  type RouteConfig,
  type AppConfig,
} from '@/lib/config-source';
import { ConfigContext } from '@/hooks/useConfig';

import '@/index.css';

// Code-based component mapping
const codeComponents: Record<string, React.ComponentType> = {
  LoginPage,
  PageBuilderPage,
  ResourceManagerPage,
  LocalesManagerPage,
  SettingsPage,
};

function App() {
  const configSource = getConfigSource();
  const [config, setConfig] = useState<AppConfig | null>(() => {
    // Embedded mode loads synchronously
    if (configSource === 'embedded') {
      return loadConfigSync();
    }
    return null;
  });
  const [loading, setLoading] = useState(configSource !== 'embedded');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Local/remote modes load asynchronously
    if (configSource !== 'embedded') {
      loadConfig()
        .then(setConfig)
        .catch((err) => {
          console.error('Failed to load config:', err);
          setError(err.message);
        })
        .finally(() => setLoading(false));
    }
  }, [configSource]);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto" />
          <p className="mt-4 text-muted-foreground">Loading configuration...</p>
        </div>
      </div>
    );
  }

  if (error || !config) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <h1 className="text-xl font-bold text-destructive">Failed to load configuration</h1>
          <p className="mt-2 text-muted-foreground">{error || 'An unknown error occurred.'}</p>
          <button
            className="mt-4 rounded bg-primary px-4 py-2 text-primary-foreground hover:bg-primary/90"
            onClick={() => window.location.reload()}
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  const resources = getRefineResources();

  // Separate public and authenticated routes
  const publicRoutes = config.routes.routes.filter((r) => !r.auth);
  const authRoutes = config.routes.routes.filter((r) => r.auth);

  return (
    <ConfigContext.Provider value={config}>
      <BrowserRouter>
        <Refine
          dataProvider={dataProvider}
          authProvider={authProvider}
          accessControlProvider={accessControlProvider}
          routerProvider={routerBindings}
          resources={resources}
          options={{
            syncWithLocation: true,
            warnWhenUnsavedChanges: true,
          }}
        >
          <Routes>
            {/* Public routes (no auth required) */}
            {publicRoutes.map((route) => (
              <Route
                key={route.path}
                path={route.path}
                element={<RouteRenderer route={route} />}
              />
            ))}

            {/* Authenticated routes */}
            <Route
              element={
                <Authenticated key="authenticated" fallback={<Navigate to="/login" />}>
                  <MainLayout />
                </Authenticated>
              }
            >
              {authRoutes.map((route) => (
                <Route
                  key={route.path}
                  path={route.path}
                  element={<RouteRenderer route={route} />}
                />
              ))}

              {/* 404 - No matching route */}
              <Route path="*" element={<NotFoundPage />} />
            </Route>
          </Routes>
        </Refine>
      </BrowserRouter>
    </ConfigContext.Provider>
  );
}

// Route renderer
const RouteRenderer: React.FC<{ route: RouteConfig }> = ({ route }) => {
  if (route.type === 'code' && route.component) {
    const Component = codeComponents[route.component];
    if (Component) {
      return <Component />;
    }
    return <div>Component not found: {route.component}</div>;
  }

  if (route.type === 'yaml') {
    const page = getPageForRoute(route);
    if (page) {
      return <DynamicPage page={page} />;
    }
    return <div>Page not found: {route.file}</div>;
  }

  return <div>Invalid route configuration</div>;
};

// 404 page
const NotFoundPage: React.FC = () => {
  const location = useLocation();

  return (
    <div className="flex h-96 flex-col items-center justify-center">
      <h1 className="text-2xl font-bold">Page Not Found</h1>
      <p className="mt-2 text-muted-foreground">
        The requested page does not exist.
      </p>
      <p className="mt-4 text-sm text-muted-foreground">
        Define this route in your YAML configuration:{' '}
        <code className="rounded bg-muted px-2 py-1">{location.pathname}</code>
      </p>
    </div>
  );
};

export default App;
