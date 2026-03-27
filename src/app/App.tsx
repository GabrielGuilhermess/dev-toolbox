import type { ReactElement } from 'react';
import { RouterProvider } from 'react-router';
import Providers from '@/app/providers';
import { router } from '@/app/router';

export default function App(): ReactElement {
  return (
    <Providers>
      <RouterProvider router={router} />
    </Providers>
  );
}
