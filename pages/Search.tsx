import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { CATEGORY_OPTIONS, CAMPUS_LOCATIONS } from '../constants';
import { Search as SearchIcon, Filter } from 'lucide-react';
import { ItemReport } from '../types';
import ClaimModal from '../components/ClaimModal';

const Search: React.FC = () => {
  const { user, refreshUser } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [selectedLocation, setSelectedLocation] = useState<string>('');
  const [items, setItems] = useState<ItemReport[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [claimItem, setClaimItem] = useState<ItemReport | null>(null);

  useEffect(() => {
    if (user && !user.isVerified) {
      refreshUser();
    }
  }, []);

  useEffect(() => {
    const fetchItems = async () => {
      setIsLoading(true);
      try {
        const reports = await api.getAllReports({
          search: searchTerm,
          category: selectedCategory,
          location: selectedLocation
        });
        setItems(reports);
      } catch (error) {
        console.error('Failed to fetch items', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    // Debounce search
    const timeoutId = setTimeout(() => {
      fetchItems();
    }, 300);
    
    return () => clearTimeout(timeoutId);
  }, [searchTerm, selectedCategory, selectedLocation]);

  const filteredItems = items.filter(item => {
    // Only show items that are approved and active (LOST or FOUND)
    return item.status === 'LOST' || item.status === 'FOUND';
  });

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-grow relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <SearchIcon className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              placeholder="Search lost items..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex gap-2">
            <select
              className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md border"
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
            >
              <option value="">All Categories</option>
              {CATEGORY_OPTIONS.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
            <select
              className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md border"
              value={selectedLocation}
              onChange={(e) => setSelectedLocation(e.target.value)}
            >
              <option value="">All Locations</option>
              {CAMPUS_LOCATIONS.map(l => <option key={l} value={l}>{l}</option>)}
            </select>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {isLoading ? (
          Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden animate-pulse">
              <div className="h-48 w-full bg-slate-200"></div>
              <div className="p-4 space-y-4">
                <div className="h-6 bg-slate-200 rounded w-3/4"></div>
                <div className="h-4 bg-slate-200 rounded w-1/4"></div>
                <div className="space-y-2">
                  <div className="h-4 bg-slate-200 rounded w-full"></div>
                  <div className="h-4 bg-slate-200 rounded w-5/6"></div>
                </div>
                <div className="flex justify-between">
                  <div className="h-6 bg-slate-200 rounded w-1/4"></div>
                  <div className="h-6 bg-slate-200 rounded w-1/4"></div>
                </div>
                <div className="h-10 bg-slate-200 rounded w-full mt-4"></div>
              </div>
            </div>
          ))
        ) : filteredItems.map((item: ItemReport) => (
          <div key={item.id} className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow">
            <div className="h-48 w-full bg-gray-200 relative">
              {item.imageUrl ? (
                <img src={item.imageUrl} alt={item.title} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-400">No Image</div>
              )}
              <div className={`absolute top-2 right-2 px-2 py-1 text-xs font-bold rounded uppercase tracking-wide text-white ${item.type === 'LOST' ? 'bg-red-500' : 'bg-green-500'}`}>
                {item.type}
              </div>
            </div>
            <div className="p-4">
              <div className="flex justify-between items-start">
                  <div>
                      <h3 className="text-lg font-medium text-gray-900">{item.title}</h3>
                      <p className="text-sm text-gray-500">{item.date}</p>
                  </div>
              </div>
              <p className="mt-2 text-sm text-gray-600 line-clamp-2">{item.description}</p>
              <div className="mt-4 flex items-center justify-between text-xs text-gray-500">
                <span className="bg-gray-100 px-2 py-1 rounded">{item.category}</span>
                <span>{item.location}</span>
              </div>
              <div className="mt-4 flex gap-2">
                <Link to={`/item/${item.id}`} className="flex-1 text-center bg-gray-50 text-blue-600 border border-blue-200 py-2 rounded-md hover:bg-blue-50 font-medium text-sm transition-colors">
                  View Details
                </Link>
                {item.type === 'LOST' && item.userId !== user?.id && (
                  <button
                    onClick={() => setClaimItem(item)}
                    className="flex-1 text-center bg-green-50 text-green-600 border border-green-200 py-2 rounded-md hover:bg-green-100 font-medium text-sm transition-colors"
                  >
                    Claim Item
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
      
      {(!isLoading && filteredItems.length === 0) && (
          <div className="text-center py-12">
              <Filter className="mx-auto h-12 w-12 text-gray-300" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No items found</h3>
              <p className="mt-1 text-sm text-gray-500">Try adjusting your search or filter to find what you're looking for.</p>
          </div>
      )}

      <ClaimModal
        isOpen={!!claimItem}
        onClose={() => setClaimItem(null)}
        onConfirm={async (message?: string) => {
          if (!claimItem) return;
          await api.claimReport(claimItem.id, message);
          setItems(prev => prev.map(i => i.id === claimItem.id ? { ...i, status: 'CLAIMED' as any } : i));
        }}
        item={claimItem}
      />
    </div>
  );
};

export default Search;