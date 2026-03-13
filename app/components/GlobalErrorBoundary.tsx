import { useRouteError, isRouteErrorResponse } from 'react-router';

export default function GlobalErrorBoundary() {
  const error = useRouteError();

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 p-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-md p-8 text-center">
        <h1 className="text-4xl font-bold text-red-500 mb-4">Oops!</h1>
        <p className="text-xl text-gray-700 mb-4">Sorry, an unexpected error has occurred.</p>
        <p className="text-gray-500 mb-8 italic">
          {isRouteErrorResponse(error)
            ? error.data?.message || error.statusText
            : error instanceof Error
            ? error.message
            : 'Unknown error'}
        </p>
        <button
          onClick={() => window.location.href = '/'}
          className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-6 rounded-lg transition-colors"
        >
          Go to Home
        </button>
      </div>
    </div>
  );
}
