import { Component, OnInit } from '@angular/core';
import { ApiService } from '../../services/api.service';
import { MatSnackBar } from '@angular/material/snack-bar';

@Component({
  selector: 'app-admin-panel',
  templateUrl: './admin-panel.component.html',
  styleUrls: ['./admin-panel.component.css']
})
export class AdminPanelComponent implements OnInit {
  stats: any = {};
  users: any[] = [];
  pickups: any[] = [];
  wasteReport: any[] = [];
  userReport: any = {};
  pickupReport: any = {};
  applicationReport: any = {};
  volunteerReport: any = { totalVolunteers: 0, activeVolunteers: 0, perVolunteer: [] };
  logs: any[] = [];
  activeTab = 'overview';
  loading = false;

  constructor(private api: ApiService, private snack: MatSnackBar) {}

  ngOnInit() {
    this.loadStats();
  }

  setTab(tab: string) {
    this.activeTab = tab;
    if (tab === 'users' && !this.users.length) this.loadUsers();
    if (tab === 'pickups' && !this.pickups.length) this.loadPickups();
    if (tab === 'reports') this.loadReports();
    if (tab === 'logs' && !this.logs.length) this.loadLogs();
  }

  loadStats() {
    this.api.getAdminStats().subscribe((data: any) => this.stats = data);
  }

  loadUsers() {
    this.loading = true;
    this.api.getAllUsers().subscribe({ next: (d: any) => { this.users = d; this.loading = false; }, error: () => this.loading = false });
  }

  loadPickups() {
    this.loading = true;
    this.api.getAdminPickups().subscribe({ next: (d: any) => { this.pickups = d; this.loading = false; }, error: () => this.loading = false });
  }

  loadReports() {
    this.api.getUserReport().subscribe((d: any) => this.userReport = d);
    this.api.getPickupReport().subscribe((d: any) => this.pickupReport = d);
    this.api.getWasteReport().subscribe((d: any) => this.wasteReport = d);
    this.api.getVolunteerReport().subscribe((d: any) => this.volunteerReport = d);
    this.api.getApplicationReport().subscribe((d: any) => this.applicationReport = d);
  }

  loadLogs() {
    this.api.getAdminLogs().subscribe((d: any) => this.logs = d);
  }

  deletePickup(id: string) {
    if (!confirm('Remove this pickup request from the platform?')) return;
    this.api.deleteAdminPickup(id).subscribe({
      next: () => {
        this.snack.open('Pickup removed', 'Close', { duration: 2000 });
        this.pickups = this.pickups.filter(p => p._id !== id);
      },
      error: (err) => this.snack.open(err.error?.message || 'Error', 'Close', { duration: 3000 })
    });
  }

  toggleSuspend(user: any) {
    this.api.suspendUser(user._id).subscribe({
      next: (res: any) => {
        user.isSuspended = res.user.isSuspended;
        this.snack.open(`User ${user.isSuspended ? 'suspended' : 'activated'}`, 'Close', { duration: 2000 });
      },
      error: (err) => this.snack.open(err.error?.message || 'Error', 'Close', { duration: 3000 })
    });
  }

  exportCSV(data: any[], filename: string) {
    if (!data || data.length === 0) return;
    const keys = Object.keys(data[0] || {});
    const rows = [keys.join(','), ...data.map(r => keys.map(k => JSON.stringify(r[k] ?? '')).join(','))];
    const blob = new Blob([rows.join('\n')], { type: 'text/csv' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `${filename}.csv`;
    a.click();
  }

  async exportPDF(title: string, rows: { label: string; value: any }[], filename: string) {
    const { jsPDF } = await import('jspdf');
    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.text(title, 14, 18);
    doc.setFontSize(10);
    doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 26);

    let y = 38;
    doc.setFontSize(12);
    rows.forEach(row => {
      doc.text(`${row.label}:`, 14, y);
      doc.text(`${row.value}`, 100, y);
      y += 8;
      if (y > 270) { doc.addPage(); y = 20; }
    });

    doc.save(`${filename}.pdf`);
  }

  exportUserReportPDF() {
    this.exportPDF('WasteZero - User Report', [
      { label: 'Total Users', value: this.userReport.total },
      { label: 'Active Users', value: this.userReport.active },
      { label: 'Volunteers', value: this.userReport.volunteers },
    ], 'user-report');
  }

  exportPickupReportPDF() {
    this.exportPDF('WasteZero - Pickup Report', [
      { label: 'Total Pickups', value: this.pickupReport.total },
      { label: 'Completed', value: this.pickupReport.completed },
      { label: 'Pending', value: this.pickupReport.pending },
      { label: 'Accepted', value: this.pickupReport.accepted },
    ], 'pickup-report');
  }

  exportVolunteerReportPDF() {
    const rows = [
      { label: 'Total Volunteers', value: this.volunteerReport.totalVolunteers },
      { label: 'Active Volunteers', value: this.volunteerReport.activeVolunteers },
      ...this.volunteerReport.perVolunteer.map((v: any) => ({ label: v.name, value: `${v.completedCount} completed` }))
    ];
    this.exportPDF('WasteZero - Volunteer Report', rows, 'volunteer-report');
  }
}
