import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class ApiService {
  private base = environment.apiUrl;

  constructor(private http: HttpClient) {}

  // Pickups
  createPickup(data: any) { return this.http.post(`${this.base}/pickups`, data); }
  getMyPickups() { return this.http.get(`${this.base}/pickups/my`); }
  getMyImpact() { return this.http.get(`${this.base}/pickups/my-impact`); }
  getOpenPickups() { return this.http.get(`${this.base}/pickups/open`); }
  getAssignedPickups() { return this.http.get(`${this.base}/pickups/assigned`); }
  acceptPickup(id: string) { return this.http.put(`${this.base}/pickups/${id}/accept`, {}); }
  completePickup(id: string) { return this.http.put(`${this.base}/pickups/${id}/complete`, {}); }

  // Opportunities
  getOpportunities(params?: any) { return this.http.get(`${this.base}/opportunities`, { params }); }
  getOpportunityById(id: string) { return this.http.get(`${this.base}/opportunities/${id}`); }
  getMatchedOpportunities() { return this.http.get(`${this.base}/opportunities/match`); }
  createOpportunity(data: any) { return this.http.post(`${this.base}/opportunities`, data); }
  updateOpportunity(id: string, data: any) { return this.http.put(`${this.base}/opportunities/${id}`, data); }
  deleteOpportunity(id: string) { return this.http.delete(`${this.base}/opportunities/${id}`); }

  // Applications
  applyForOpportunity(opportunity_id: string) { return this.http.post(`${this.base}/applications`, { opportunity_id }); }
  getMyApplications() { return this.http.get(`${this.base}/applications/my`); }
  getApplicationsForOpportunity(id: string) { return this.http.get(`${this.base}/applications/opportunity/${id}`); }
  updateApplicationStatus(id: string, status: string) { return this.http.put(`${this.base}/applications/${id}`, { status }); }

  // Messages
  sendMessage(receiverId: string, content: string) { return this.http.post(`${this.base}/messages`, { receiverId, content }); }
  getConversation(userId: string) { return this.http.get(`${this.base}/messages/${userId}`); }
  getContacts() { return this.http.get(`${this.base}/messages/contacts`); }
  getContactableUsers() { return this.http.get(`${this.base}/messages/contactable-users`); }

  // Notifications
  getNotifications() { return this.http.get(`${this.base}/notifications`); }
  markNotificationRead(id: string) { return this.http.put(`${this.base}/notifications/${id}/read`, {}); }

  // Admin
  getAdminStats() { return this.http.get(`${this.base}/admin/stats`); }
  getAllUsers() { return this.http.get(`${this.base}/admin/users`); }
  suspendUser(id: string) { return this.http.put(`${this.base}/admin/users/${id}/suspend`, {}); }
  getUserReport() { return this.http.get(`${this.base}/admin/reports/users`); }
  getPickupReport() { return this.http.get(`${this.base}/admin/reports/pickups`); }
  getWasteReport() { return this.http.get(`${this.base}/admin/reports/waste`); }
  getVolunteerReport() { return this.http.get(`${this.base}/admin/reports/volunteers`); }
  getApplicationReport() { return this.http.get(`${this.base}/admin/reports/applications`); }
  deleteAdminPickup(id: string) { return this.http.delete(`${this.base}/admin/pickups/${id}`); }
  getAdminLogs() { return this.http.get(`${this.base}/admin/logs`); }
  getAdminPickups() { return this.http.get(`${this.base}/admin/pickups`); }
}
