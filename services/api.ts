import { ItemReport, User, ItemStatus } from '../types';
import { toast } from 'sonner';

class ApiService {
  private getHeaders() {
    const token = localStorage.getItem('unifound_token');
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    };
  }

  // Reports
  async getMyReports(): Promise<ItemReport[]> {
    try {
      const response = await fetch('/api/reports/me', { headers: this.getHeaders() });
      if (!response.ok) throw new Error('Failed to fetch reports');
      const reports: any[] = await response.json();
      return reports.map(this.mapReport);
    } catch (error) {
      console.error(error);
      return [];
    }
  }

  async getAllReports(filters?: { search?: string; category?: string; location?: string }): Promise<ItemReport[]> {
    try {
      const response = await fetch('/api/reports', { headers: this.getHeaders() });
      if (!response.ok) throw new Error('Failed to fetch reports');
      let reports: any[] = await response.json();

      if (filters) {
        if (filters.category) {
          reports = reports.filter(r => r.category === filters.category);
        }
        if (filters.location) {
          reports = reports.filter(r => r.location === filters.location);
        }
        if (filters.search) {
          const searchLower = filters.search.toLowerCase();
          reports = reports.filter(r => 
            r.title.toLowerCase().includes(searchLower) || 
            (r.description && r.description.toLowerCase().includes(searchLower))
          );
        }
      }

      return reports.map(this.mapReport);
    } catch (error) {
      console.error(error);
      return [];
    }
  }

  async getReportById(id: string): Promise<ItemReport> {
    const response = await fetch(`/api/reports/${id}`, { headers: this.getHeaders() });
    if (!response.ok) throw new Error('Report not found');
    const data = await response.json();
    return this.mapReport(data);
  }

  async getMatches(id: string): Promise<ItemReport[]> {
    try {
      const currentItem = await this.getReportById(id);
      const allReports = await this.getAllReports();
      
      const oppositeType = currentItem.type === 'LOST' ? 'FOUND' : 'LOST';
      
      return allReports.filter(r => 
        r.type === oppositeType && 
        r.category === currentItem.category &&
        r.id !== id &&
        (r.status === ItemStatus.LOST || r.status === ItemStatus.FOUND || r.status === ItemStatus.PENDING)
      );
    } catch (error) {
      console.error(error);
      return [];
    }
  }

  async createReport(reportData: Partial<ItemReport>): Promise<ItemReport> {
    const response = await fetch('/api/reports', {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(reportData)
    });

    if (!response.ok) throw new Error('Failed to create report');
    const data = await response.json();
    return this.getReportById(data.id);
  }

  async claimReport(id: string, _message?: string): Promise<void> {
    const response = await fetch(`/api/reports/${id}/claim`, {
      method: 'PUT',
      headers: this.getHeaders()
    });

    if (!response.ok) throw new Error('Failed to claim report');
    toast.success('Item claimed successfully!');
  }

  async deleteReport(id: string): Promise<void> {
    const response = await fetch(`/api/reports/${id}`, {
      method: 'DELETE',
      headers: this.getHeaders()
    });

    if (!response.ok) throw new Error('Failed to delete report');
    toast.success('Report deleted');
  }

  // Helper to map DB fields to Frontend types
  private mapReport(dbReport: any): ItemReport {
    return {
      id: dbReport.id,
      userId: dbReport.user_id,
      type: dbReport.type as 'LOST' | 'FOUND',
      title: dbReport.title,
      description: dbReport.description || '',
      category: dbReport.category || 'Other',
      location: dbReport.location || 'Unknown',
      date: dbReport.date || '',
      status: dbReport.status as ItemStatus,
      imageUrl: dbReport.image_url,
      claimedBy: dbReport.claimed_by,
      reporterName: dbReport.userName,
      dateReported: dbReport.created_at,
      createdAt: dbReport.created_at,
      updatedAt: dbReport.updated_at
    };
  }

  // Admin stats
  async getAdminStats(): Promise<any> {
    const response = await fetch('/api/admin/stats', { headers: this.getHeaders() });
    if (!response.ok) throw new Error('Failed to fetch admin stats');
    return await response.json();
  }

  async getPendingReports(): Promise<ItemReport[]> {
    const response = await fetch('/api/admin/reports/pending', { headers: this.getHeaders() });
    if (!response.ok) throw new Error('Failed to fetch pending reports');
    const data = await response.json();
    return data.map(this.mapReport);
  }

  async updateReportStatus(id: string, status: string, approved: boolean): Promise<void> {
    const response = await fetch(`/api/admin/reports/${id}/status`, {
      method: 'PUT',
      headers: this.getHeaders(),
      body: JSON.stringify({ status: approved ? status : 'REJECTED' })
    });

    if (!response.ok) throw new Error('Failed to update report status');
  }

  // Admin: User Management
  async getAllUsers(): Promise<User[]> {
    const response = await fetch('/api/admin/users', { headers: this.getHeaders() });
    if (!response.ok) throw new Error('Failed to fetch users');
    return await response.json();
  }

  async updateUserRole(userId: string, role: 'STUDENT' | 'ADMIN'): Promise<void> {
    const response = await fetch(`/api/admin/users/${userId}/role`, {
      method: 'PUT',
      headers: this.getHeaders(),
      body: JSON.stringify({ role })
    });

    if (!response.ok) throw new Error('Failed to update user role');
  }

  // Notifications
  async getNotifications(): Promise<any[]> {
    try {
      const response = await fetch('/api/notifications', { headers: this.getHeaders() });
      if (!response.ok) throw new Error('Failed to fetch notifications');
      return await response.json();
    } catch (error) {
      console.error(error);
      return [];
    }
  }
}

export const api = new ApiService();
