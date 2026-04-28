import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { ArrowLeft, MapPin, Clock, Tag, User as UserIcon, SearchX, AlertCircle } from 'lucide-react';
import Button from '../components/Button';
import { ItemReport } from '../types';
import { toast } from 'sonner';
import ClaimModal from '../components/ClaimModal';

const ItemDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [item, setItem] = useState<ItemReport | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isClaimModalOpen, setIsClaimModalOpen] = useState(false);

  useEffect(() => {
    const fetchItem = async () => {
      if (!id) return;
      setIsLoading(true);
      setError(null);
      try {
        const report = await api.getReportById(id);
        setItem(report);
      } catch (err) {
        console.error('Failed to fetch item details', err);
        setError('Failed to load item details. Please try again later.');
      } finally {
        setIsLoading(false);
      }
    };
    fetchItem();
  }, [id]);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-4">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        <p className="text-slate-500 font-medium">Loading item details...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] px-4">
        <div className="bg-red-50 p-10 rounded-3xl shadow-lg border border-red-200 max-w-lg w-full text-center">
          <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <AlertCircle className="h-10 w-10 text-red-600" />
          </div>
          <h2 className="text-3xl font-bold text-red-900 font-serif mb-4">Oops! Something went wrong</h2>
          <p className="text-red-700 text-lg mb-8">{error}</p>
          <Button onClick={() => navigate(-1)} className="w-full py-3 text-lg bg-red-600 hover:bg-red-700 text-white">Go Back</Button>
        </div>
      </div>
    );
  }

  if (!item) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] px-4">
        <div className="bg-slate-50 p-10 rounded-3xl shadow-lg border border-slate-200 max-w-lg w-full text-center">
          <div className="w-20 h-20 bg-slate-200 rounded-full flex items-center justify-center mx-auto mb-6">
            <SearchX className="h-10 w-10 text-slate-500" />
          </div>
          <h2 className="text-3xl font-bold text-slate-900 font-serif mb-4">Item Not Found</h2>
          <p className="text-slate-600 text-lg mb-8">The item you are looking for does not exist or has been removed.</p>
          <Button onClick={() => navigate(-1)} variant="secondary" className="w-full py-3 text-lg">Go Back</Button>
        </div>
      </div>
    );
  }

  const handleNotifyOwner = async () => {
    if (!item) return;
    toast.success('Owner notified! (Simulation)');
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <button 
        onClick={() => navigate(-1)} 
        className="flex items-center text-sm text-gray-500 hover:text-gray-900 transition-colors"
      >
        <ArrowLeft className="w-4 h-4 mr-1" />
        Back
      </button>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="md:flex">
          <div className="md:w-1/2 h-64 md:h-auto bg-gray-200 relative">
            {item.imageUrl ? (
              <img src={item.imageUrl} alt={item.title} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-gray-400">
                No Image Available
              </div>
            )}
            <div className={`absolute top-4 right-4 px-3 py-1 text-sm font-bold rounded shadow-sm uppercase tracking-wide text-white ${item.type === 'LOST' ? 'bg-red-500' : 'bg-green-500'}`}>
              {item.type}
            </div>
          </div>
          
          <div className="p-8 md:w-1/2 flex flex-col">
            <div className="flex-grow">
              <div className="flex justify-between items-start mb-4">
                <h1 className="text-4xl font-bold text-slate-900 font-serif tracking-tight">{item.title}</h1>
              </div>
              
              <div className="space-y-4 mb-6">
                <div className="flex items-center text-gray-600">
                  <Tag className="w-5 h-5 mr-3 text-gray-400" />
                  <span className="font-medium">{item.category}</span>
                </div>
                <div className="flex items-center text-gray-600">
                  <MapPin className="w-5 h-5 mr-3 text-gray-400" />
                  <span>{item.location}</span>
                </div>
                <div className="flex items-center text-gray-600">
                  <Clock className="w-5 h-5 mr-3 text-gray-400" />
                  <span>{new Date(item.date).toLocaleDateString()}</span>
                </div>
                <div className="flex items-start text-gray-600">
                  <UserIcon className="w-5 h-5 mr-3 mt-0.5 text-gray-400" />
                  <div>
                    {item.reporterName ? (
                      <>
                        <span className="block font-medium text-gray-900">Reported by {item.reporterName}</span>
                        <span className="block text-sm text-gray-500">{item.reporterEmail}</span>
                      </>
                    ) : (
                      <span>Reported by User #{item.userId.substring(0, 5)}</span>
                    )}
                  </div>
                </div>
              </div>

              <div className="border-t border-gray-100 pt-6 mb-6">
                <h3 className="text-lg font-medium text-gray-900 mb-2">Description</h3>
                <p className="text-gray-600 whitespace-pre-line">{item.description}</p>
              </div>
            </div>

            <div className="mt-auto pt-6 border-t border-gray-100">
              {user?.id === item.userId ? (
                <div className="bg-blue-50 text-blue-800 p-4 rounded-lg text-sm text-center">
                  This is your report. You can manage it from your dashboard.
                </div>
              ) : (
                <div className="space-y-4">
                  {!user?.isVerified && (
                    <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex flex-col gap-3">
                      <div className="flex items-start gap-3">
                        <AlertCircle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
                        <p className="text-sm text-amber-800">
                          You must verify your email to claim items or notify owners.
                        </p>
                      </div>
                    </div>
                  )}
                  <div className="flex gap-4">
                    <Button 
                      className="flex-1 py-3 text-lg font-medium"
                      onClick={handleNotifyOwner}
                      disabled={!user?.isVerified}
                    >
                      {item.type === 'LOST' ? 'I Found This Item' : 'This Is My Item'}
                    </Button>
                    {item.type === 'LOST' && item.userId !== user?.id && (
                      <Button
                        className="flex-1 py-3 text-lg font-medium bg-green-600 hover:bg-green-700 text-white border-green-600"
                        onClick={() => setIsClaimModalOpen(true)}
                        disabled={!user?.isVerified}
                      >
                        Claim Item
                      </Button>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <ClaimModal
        isOpen={isClaimModalOpen}
        onClose={() => {
          setIsClaimModalOpen(false);
          navigate('/dashboard');
        }}
        onConfirm={async (message?: string) => {
          if (!item) return;
          await api.claimReport(item.id, message);
        }}
        item={item}
      />
    </div>
  );
};

export default ItemDetails;
