import { RouterProvider } from 'react-router-dom';
import { Suspense } from 'react';
import { router } from './routes/AppRoutes';
import LoadingSpinner from './components/ui/LoadingSpinner';

function App() {
  return (
    <Suspense fallback={<LoadingSpinner className="min-h-screen" />}>
      <RouterProvider router={router} />
    </Suspense>
  );
}

export default App;