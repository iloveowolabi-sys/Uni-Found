import React from 'react';
import { Link } from 'react-router-dom';
import Button from '../components/Button';
import { Search, PlusCircle, CheckCircle } from 'lucide-react';

const Home: React.FC = () => {
  return (
    <div className="space-y-16 pb-12">
      {/* Hero Section */}
      <section className="relative bg-slate-900 text-white rounded-3xl overflow-hidden shadow-2xl">
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1541339907198-e08756dedf3f?ixlib=rb-1.2.1&auto=format&fit=crop&w=1950&q=80')] bg-center bg-cover"></div>
        {/* Dark gradient overlay to ensure text pops */}
        <div className="absolute inset-0 bg-gradient-to-b from-slate-900/90 via-slate-900/80 to-slate-900/95"></div>
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-28 text-center">
          <h1 className="text-4xl sm:text-5xl lg:text-7xl mb-6 font-serif font-bold text-white drop-shadow-2xl">
            Lost something? <br/> <span className="italic text-blue-400">Let's find it together.</span>
          </h1>
          <p className="mt-6 max-w-2xl mx-auto text-xl text-slate-200 drop-shadow-md font-medium">
            The official university portal for reporting lost items and reuniting found objects with their owners.
          </p>
          <div className="mt-10 flex flex-col sm:flex-row justify-center gap-4">
            <Link to="/report">
              <Button variant="primary" className="w-full sm:w-auto px-8 py-4 text-lg font-bold shadow-lg hover:shadow-blue-500/20">
                I Lost Something
              </Button>
            </Link>
             <Link to="/report">
              <Button variant="secondary" className="w-full sm:w-auto px-8 py-4 text-lg font-bold shadow-lg">
                I Found Something
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="p-6 bg-white rounded-xl shadow-md border border-gray-100 text-center hover:shadow-lg transition-shadow">
            <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <PlusCircle size={24} />
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-2">Easy Reporting</h3>
            <p className="text-gray-600">Submit a report in seconds with our smart forms to describe your items accurately.</p>
          </div>
          <div className="p-6 bg-white rounded-xl shadow-md border border-gray-100 text-center hover:shadow-lg transition-shadow">
            <div className="w-12 h-12 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <Search size={24} />
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-2">Smart Search</h3>
            <p className="text-gray-600">Filter by category, date, and location. Our matching algorithm suggests potential matches automatically.</p>
          </div>
          <div className="p-6 bg-white rounded-xl shadow-md border border-gray-100 text-center hover:shadow-lg transition-shadow">
            <div className="w-12 h-12 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle size={24} />
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-2">Secure Return</h3>
            <p className="text-gray-600">Identity verification ensures items are returned to their rightful owners safely and securely.</p>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;