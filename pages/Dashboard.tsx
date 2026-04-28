import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { ItemReport, ItemStatus } from '../types';
import { Link } from 'react-router-dom';
import { Clock, MapPin, Tag, AlertCircle } from 'lucide-react';
import ClaimModal from '../components/ClaimModal';

const Dashboard: React.FC = () => {
  const { user, resendVerification, refreshUser } = useAuth();
  const [myReports, setMyReports] = useState<ItemReport[]>([]);
  const [matches, setMatches] = useState<{ report: ItemReport, matches: ItemReport[] }[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [claimItem, setClaimItem] = useState<ItemReport | null>(null);
  const [isResending, setIsResending] = useState(false);
  
  const handleResend = async () => {
    setIsResending(true);
    try {
      await resendVerification();
    } finally {
      setIsResending(false);
    }
  };

  const handleRefresh = async () => {
    setIsLoading(true);
    try {
      await refreshUser();
    } catch (error) {
      console.error('Refresh failed', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const fetchReportsAndMatches = async () => {
      try {
        const reports = await api.getMyReports();
        setMyReports(reports);

        // Fetch matches for unresolved reports
        const unresolvedReports = reports.filter(r => r.status !== ItemStatus.RESOLVED && r.status !== ItemStatus.CLAIMED);
        
        const matchesData = await Promise.all(
          unresolvedReports.map(async (report) => {
            const reportMatches = await api.getMatches(report.id);
            return { report, matches: reportMatches };
          })
        );

        // Filter out reports with no matches
        setMatches(matchesData.filter(m => m.matches.length > 0));

      } catch (error) {
        console.error('Failed to fetch reports or matches', error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchReportsAndMatches();
  }, []);

  const getStatusBadge = (status: ItemStatus) => {
    switch (status) {
      case ItemStatus.PENDING: 
        return <span className="px-3 py-1 inline-flex items-center text-xs font-semibold rounded-full bg-yellow-50 text-yellow-700 border border-yellow-200 shadow-sm">Pending Approval</span>;
      case ItemStatus.LOST: 
        return <span className="px-3 py-1 inline-flex items-center text-xs font-semibold rounded-full bg-red-50 text-red-700 border border-red-200 shadow-sm">Lost</span>;
      case ItemStatus.FOUND: 
        return <span className="px-3 py-1 inline-flex items-center text-xs font-semibold rounded-full bg-green-50 text-green-700 border border-green-200 shadow-sm">Found</span>;
      case ItemStatus.CLAIMED: 
        return <span className="px-3 py-1 inline-flex items-center text-xs font-semibold rounded-full bg-gray-50 text-gray-700 border border-gray-200 shadow-sm">Claimed</span>;
      case ItemStatus.RESOLVED: 
        return <span className="px-3 py-1 inline-flex items-center text-xs font-semibold rounded-full bg-blue-50 text-blue-700 border border-blue-200 shadow-sm">Resolved</span>;
      default: 
        return <span className="px-3 py-1 inline-flex items-center text-xs font-semibold rounded-full bg-gray-50 text-gray-700 border border-gray-200 shadow-sm">{status}</span>;
    }
  };

  const [filterStatus, setFilterStatus] = useState<string>('ALL');

  const filteredReports = myReports.filter(report => 
    filterStatus === 'ALL' ? true : report.status === filterStatus
  );

  return (
    <div className="space-y-10 max-w-6xl mx-auto py-8">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between bg-white p-8 rounded-3xl shadow-sm border border-slate-100">
        <div>
          <h1 className="text-4xl font-bold text-slate-900 font-serif tracking-tight">Welcome back, {user?.name}</h1>
          <p className="text-slate-500 mt-2 text-lg">Manage your reports and view potential matches.</p>
        </div>
        <div className="mt-6 md:mt-0">
          <Link to="/report" className="inline-flex items-center px-6 py-3 border border-transparent rounded-xl shadow-sm text-base font-medium text-white bg-blue-600 hover:bg-blue-700 transition-all hover:shadow-md hover:-translate-y-0.5">
            Submit New Report
          </Link>
        </div>
      </div>

      {/* Suggested Matches Section */}
      {matches.length > 0 && (
        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-100/50 rounded-3xl p-8 shadow-sm">
          <div className="flex items-center mb-4">
            <AlertCircle className="h-7 w-7 text-blue-600 mr-3" />
            <h3 className="text-2xl font-bold text-blue-900 font-serif">Potential Matches Found</h3>
          </div>
          <p className="text-base text-blue-700/80 mb-8">Our system detected potential matches for your items.</p>
          
          <div className="space-y-6">
            {matches.map(({ report, matches: reportMatches }) => (
              <div key={`matches-for-${report.id}`} className="bg-white p-6 rounded-2xl shadow-sm border border-white/60">
                <h4 className="font-semibold text-slate-800 mb-5 border-b border-slate-100 pb-4 font-serif text-xl">
                  Matches for your {report.type.toLowerCase()}: <span className="text-blue-600">{report.title}</span>
                </h4>
                
                <div className="space-y-4">
                  {reportMatches.map(match => (
                    <div key={match.id} className="flex items-start gap-5 p-5 bg-slate-50/50 rounded-2xl border border-slate-100 hover:bg-slate-50 transition-colors group">
                      <div className="h-20 w-20 bg-slate-200 rounded-xl overflow-hidden flex-shrink-0 shadow-sm">
                        {match.imageUrl ? (
                          <img src={match.imageUrl} alt="Match" className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-500" />
                        ) : (
                          <div className="h-full w-full bg-slate-200 flex items-center justify-center text-slate-400 text-xs font-medium">No Image</div>
                        )}
                      </div>
                      <div className="flex-grow">
                        <div className="flex justify-between items-start">
                          <h5 className="font-bold text-slate-900 text-lg">{match.title}</h5>
                          <span className="text-xs font-bold bg-green-100 text-green-800 px-3 py-1.5 rounded-full shadow-sm border border-green-200/50">
                            {match.matchScore}% Match
                          </span>
                        </div>
                        <p className="text-sm text-slate-600 mt-2 line-clamp-2 leading-relaxed">{match.description}</p>
                        <div className="mt-4 flex items-center gap-2">
                          <Link to={`/item/${match.id}`} className="text-sm font-medium bg-white border border-slate-200 text-slate-700 px-4 py-2 rounded-xl hover:border-blue-300 hover:text-blue-600 transition-all shadow-sm hover:shadow">
                            View Details
                          </Link>
                          {match.type === 'LOST' && match.userId !== user?.id && (
                            <button
                              onClick={() => setClaimItem(match)}
                              className="text-sm font-medium bg-green-50 border border-green-200 text-green-700 px-4 py-2 rounded-xl hover:bg-green-100 transition-all shadow-sm hover:shadow"
                            >
                              Claim Item
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="bg-transparent">
        <div className="mb-6 px-2 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <h3 className="text-3xl font-bold text-slate-900 font-serif">My Reports</h3>
          
          <div className="relative">
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="appearance-none bg-white border border-slate-200 text-slate-700 py-2.5 pl-4 pr-10 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent font-medium text-sm cursor-pointer hover:border-slate-300 transition-colors"
            >
              <option value="ALL">All Statuses</option>
              <option value="PENDING">Pending</option>
              <option value="LOST">Lost</option>
              <option value="FOUND">Found</option>
              <option value="RESOLVED">Resolved</option>
              <option value="CLAIMED">Claimed</option>
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-slate-500">
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
            </div>
          </div>
        </div>
        
        <ul className="space-y-5">
          {isLoading ? (
            Array.from({ length: 3 }).map((_, i) => (
              <li key={i} className="bg-white border border-slate-100 rounded-3xl shadow-sm p-8 animate-pulse">
                <div className="flex justify-between items-center mb-4">
                  <div className="h-6 bg-slate-200 rounded-md w-1/3"></div>
                  <div className="h-6 bg-slate-200 rounded-full w-20"></div>
                </div>
                <div className="sm:flex sm:justify-between items-center">
                  <div className="sm:flex space-y-3 sm:space-y-0 sm:space-x-4">
                    <div className="h-8 bg-slate-200 rounded-xl w-24"></div>
                    <div className="h-8 bg-slate-200 rounded-xl w-32"></div>
                  </div>
                  <div className="mt-4 sm:mt-0 h-4 bg-slate-200 rounded-md w-24"></div>
                </div>
              </li>
            ))
          ) : filteredReports.length > 0 ? (
            filteredReports.map((report) => (
              <li key={report.id} className="bg-white border border-slate-100 rounded-3xl shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden group hover:-translate-y-1">
                <Link to={`/item/${report.id}`} className="block">
                  <div className="px-8 py-6">
                    <div className="flex items-center justify-between mb-4">
                      <p className="text-xl font-bold text-slate-900 group-hover:text-blue-600 transition-colors truncate pr-4">{report.title}</p>
                      <div className="flex-shrink-0 flex">
                        {getStatusBadge(report.status)}
                      </div>
                    </div>
                    <div className="sm:flex sm:justify-between items-center">
                      <div className="sm:flex space-y-3 sm:space-y-0 sm:space-x-4">
                        <p className="flex items-center text-sm font-medium text-slate-600 bg-slate-50 px-3.5 py-1.5 rounded-xl border border-slate-100">
                          <Tag className="flex-shrink-0 mr-2 h-4 w-4 text-slate-400" />
                          {report.category}
                        </p>
                        <p className="flex items-center text-sm font-medium text-slate-600 bg-slate-50 px-3.5 py-1.5 rounded-xl border border-slate-100">
                          <MapPin className="flex-shrink-0 mr-2 h-4 w-4 text-slate-400" />
                          {report.location}
                        </p>
                      </div>
                      <div className="mt-4 sm:mt-0 flex items-center text-sm font-medium text-slate-400">
                        <Clock className="flex-shrink-0 mr-2 h-4 w-4" />
                        <p>
                          <time dateTime={report.date}>{new Date(report.date).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}</time>
                        </p>
                      </div>
                    </div>
                  </div>
                </Link>
              </li>
            ))
          ) : (
            <li className="px-6 py-16 text-center text-slate-500 bg-white rounded-3xl border border-slate-100 shadow-sm">
              <div className="flex flex-col items-center justify-center">
                <div className="h-16 w-16 bg-slate-50 rounded-full flex items-center justify-center mb-4 border border-slate-100">
                  <Tag className="h-8 w-8 text-slate-300" />
                </div>
                <p className="text-lg font-bold text-slate-900">No reports found</p>
                <p className="text-base mt-2 text-slate-500">Good news, or time to report something?</p>
              </div>
            </li>
          )}
        </ul>
      </div>

      <ClaimModal
        isOpen={!!claimItem}
        onClose={() => setClaimItem(null)}
        onConfirm={async (message?: string) => {
          if (!claimItem) return;
          await api.claimReport(claimItem.id, message);
          setMatches(prev => prev.map(m => ({
            ...m,
            matches: m.matches.filter(item => item.id !== claimItem.id)
          })).filter(m => m.matches.length > 0));
        }}
        item={claimItem}
      />
    </div>
  );
};

export default Dashboard;