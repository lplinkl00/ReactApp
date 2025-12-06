import { useState } from 'react';
import Header from './Header';
import Globe from './Globe';

function App() {
  const [searchQuery, setSearchQuery] = useState('');
  const [showMap, setShowMap] = useState(false);

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    console.log('Search query:', query);
  };

  // Uncomment the line below to show the map by default
  // return <Globe />;

  return (
    <div className="min-h-screen bg-gray-50">
      <Header onSearch={handleSearch} searchQuery={searchQuery} />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">
          Welcome to Campaign Tracker MY
        </h1>
        <button
          onClick={() => setShowMap(!showMap)}
          className="mb-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          {showMap ? 'Hide Map' : 'Show Volunteer Opportunities Map'}
        </button>
        {showMap && <Globe />}
        {searchQuery && !showMap && (
          <p className="text-gray-600">
            Searching for: <strong>{searchQuery}</strong>
          </p>
        )}
      </main>
    </div>
  );
}

export default App;

