import { createHashRouter } from 'react-router-dom';
import App from './App';
import IndexPage from './pages/index'; // Changed to import the correct home page component

// Using HashRouter with actual components
const router = createHashRouter([
  {
    path: '/',
    element: <App />,
    children: [
      {
        path: '',  // Empty string matches the root path
        element: <IndexPage />, // Using the correct component
      },
      // Add other routes here as needed
    ]
  },
]);

export default router;
