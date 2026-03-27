import { lazy, type ComponentType } from 'react';
import { createBrowserRouter } from 'react-router';
import HomePage from '@/app/HomePage';
import NotFoundPage from '@/app/NotFoundPage';
import { Layout } from '@/shared/components';
import { toolRegistry } from '@/shared/constants';

interface ToolPageModule {
  default: ComponentType;
}

const featureModules = import.meta.glob<ToolPageModule>(
  '../features/*/index.ts',
);

function getToolPath(path: string): string {
  return path.replace(/^\//u, '');
}

function getToolPageLoader(toolId: string): () => Promise<ToolPageModule> {
  const loader = featureModules[`../features/${toolId}/index.ts`];

  if (loader === undefined) {
    return (): Promise<ToolPageModule> =>
      Promise.reject(
        new Error(`Pagina da ferramenta ${toolId} nao encontrada.`),
      );
  }

  return loader;
}

export const router = createBrowserRouter([
  {
    path: '/',
    element: <Layout />,
    children: [
      {
        index: true,
        element: <HomePage />,
      },
      ...toolRegistry.map((tool) => {
        const ToolPage = lazy(getToolPageLoader(tool.id));

        return {
          path: getToolPath(tool.path),
          element: <ToolPage />,
        };
      }),
      {
        path: '*',
        element: <NotFoundPage />,
      },
    ],
  },
]);
