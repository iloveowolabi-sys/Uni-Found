import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { api } from '../services/api';
import { ItemReport, User } from '../types';
import Button from '../components/Button';
import { CheckCircle, XCircle, AlertTriangle, Users, Shield, User as UserIcon } from 'lucide-react';
import { toast } from 'sonner';

const AdminDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'overview' | 'users'>('overview');
  const [pendingReports, setPendingReports] = useState<ItemReport[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [reportsData, statsData, usersData] = await Promise.all([
          api.getPendingReports(),
          api.getAdminStats(),
          api.getAllUsers()
        ]);
        setPendingReports(reportsData);
        setStats(statsData);
        setUsers(usersData);
      } catch (error) {
        console.error('Failed to load admin data', error);
      } finally {
        setIsLoading(false);
      }
    };
    loadData();
  }, []);

  const handleStatusUpdate = async (id: string, status: string, approved: boolean) => {
    try {
      await api.updateReportStatus(id, status, approved);
      setPendingReports(prev => prev.filter(report => report.id !== id));
      toast.success(`Report ${approved ? 'approved' : 'rejected'} successfully`);
    } catch (error) {
      console.error('Failed to update report status', error);
      toast.error('Failed to update report status');
    }
  };

  const handleRoleUpdate = async (userId: string, newRole: 'STUDENT' | 'ADMIN') => {
    try {
      await api.updateUserRole(userId, newRole);
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, role: newRole } : u));
      toast.success(`User role updated to ${newRole}`);
    } catch (error) {
      console.error('Failed to update user role', error);
      toast.error('Failed to update user role');
    }
  };

  const data = stats?.weeklyActivity || [];
  const pieData = stats?.categoryDistribution || [];

  if (isLoading) {
    return <div className="p-8 text-center">Loading admin data...</div>;
  }

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
          <p className="text-gray-500">Manage system metrics, reports, and users</p>
        </div>
        <div className="mt-4 sm:mt-0 flex space-x-2 bg-white p-1 rounded-lg border border-gray-200 shadow-sm">
          <button
            onClick={() => setActiveTab('overview')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              activeTab === 'overview' ? 'bg-blue-50 text-blue-700' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
            }`}
          >
            Overview & Reports
          </button>
          <button
            onClick={() => setActiveTab('users')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              activeTab === 'users' ? 'bg-blue-50 text-blue-700' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
            }`}
          >
            User Management
          </button>
        </div>
      </div>

      {activeTab === 'overview' && (
        <>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Weekly Activity Chart */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Weekly Report Activity</h3>
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="lost" fill="#EF4444" name="Lost Reports" />
                    <Bar dataKey="found" fill="#10B981" name="Found Reports" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Category Distribution */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Items by Category</h3>
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      fill="#8884d8"
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend layout="vertical" verticalAlign="middle" align="right" />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Moderation Queue */}
          <div className="bg-white shadow overflow-hidden sm:rounded-lg border border-gray-200">
            <div className="px-4 py-5 sm:px-6 flex justify-between items-center bg-gray-50">
              <h3 className="text-lg leading-6 font-medium text-gray-900">Recent Reports Requiring Approval</h3>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                {pendingReports.length} Pending
              </span>
            </div>
            <div className="border-t border-gray-200">
              <ul className="divide-y divide-gray-200">
                {isLoading ? (
                  Array.from({ length: 3 }).map((_, i) => (
                    <li key={i} className="px-4 py-4 sm:px-6 animate-pulse">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10 bg-slate-200 rounded-full"></div>
                          <div className="ml-4 space-y-2">
                            <div className="h-4 bg-slate-200 rounded w-32"></div>
                            <div className="h-3 bg-slate-200 rounded w-24"></div>
                          </div>
                        </div>
                        <div className="flex space-x-2">
                          <div className="h-8 w-8 bg-slate-200 rounded-md"></div>
                          <div className="h-8 w-24 bg-slate-200 rounded-md"></div>
                          <div className="h-8 w-24 bg-slate-200 rounded-md"></div>
                        </div>
                      </div>
                    </li>
                  ))
                ) : pendingReports.map((report) => (
                  <li key={report.id} className="px-4 py-4 sm:px-6 hover:bg-gray-50">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10">
                          {report.imageUrl ? (
                            <img className="h-10 w-10 rounded-full object-cover" src={report.imageUrl} alt="" />
                          ) : (
                            <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center text-gray-500 text-xs">No Img</div>
                          )}
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-blue-600">{report.title}</div>
                          <div className="text-sm text-gray-500">{report.type} - {report.category}</div>
                        </div>
                      </div>
                      <div className="flex space-x-2">
                         <Button variant="ghost" className="text-gray-400 hover:text-gray-600">
                            <AlertTriangle size={18} />
                         </Button>
                         <Button variant="secondary" className="bg-green-50 text-green-700 hover:bg-green-100 border-green-200" onClick={() => handleStatusUpdate(report.id, 'APPROVED', true)}>
                            <CheckCircle size={18} className="mr-1" /> Approve
                         </Button>
                         <Button variant="secondary" className="bg-red-50 text-red-700 hover:bg-red-100 border-red-200" onClick={() => handleStatusUpdate(report.id, 'REJECTED', false)}>
                            <XCircle size={18} className="mr-1" /> Reject
                         </Button>
                      </div>
                    </div>
                  </li>
                ))}
                {(!isLoading && pendingReports.length === 0) && (
                  <li className="px-4 py-8 text-center text-gray-500">
                    No pending reports requiring approval.
                  </li>
                )}
              </ul>
            </div>
          </div>
        </>
      )}

      {activeTab === 'users' && (
        <div className="bg-white shadow overflow-hidden sm:rounded-lg border border-gray-200">
          <div className="px-4 py-5 sm:px-6 flex justify-between items-center bg-gray-50">
            <div className="flex items-center">
              <Users className="h-5 w-5 text-gray-400 mr-2" />
              <h3 className="text-lg leading-6 font-medium text-gray-900">User Management</h3>
            </div>
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
              {users.length} Total Users
            </span>
          </div>
          <div className="border-t border-gray-200">
            <ul className="divide-y divide-gray-200">
              {isLoading ? (
                <li className="px-4 py-8 text-center text-gray-500">Loading users...</li>
              ) : users.map((u) => (
                <li key={u.id} className="px-4 py-4 sm:px-6 hover:bg-gray-50">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10 bg-gray-100 rounded-full flex items-center justify-center overflow-hidden">
                        {u.avatar ? (
                          <img src={u.avatar} alt={u.name} className="h-full w-full object-cover" />
                        ) : (
                          <UserIcon className="h-5 w-5 text-gray-400" />
                        )}
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900 flex items-center">
                          {u.name}
                          {u.role === 'ADMIN' && <Shield className="h-3 w-3 text-blue-500 ml-1" />}
                        </div>
                        <div className="text-sm text-gray-500">{u.email}</div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        u.role === 'ADMIN' ? 'bg-purple-100 text-purple-800' : 'bg-gray-100 text-gray-800'
                      }`}>
                        {u.role}
                      </span>
                      {u.email !== 'i.love.owolabi@gmail.com' && (
                        <select
                          value={u.role}
                          onChange={(e) => handleRoleUpdate(u.id, e.target.value as 'STUDENT' | 'ADMIN')}
                          className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
                        >
                          <option value="STUDENT">Student</option>
                          <option value="ADMIN">Admin</option>
                        </select>
                      )}
                    </div>
                  </div>
                </li>
              ))}
              {(!isLoading && users.length === 0) && (
                <li className="px-4 py-8 text-center text-gray-500">
                  No users found.
                </li>
              )}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;