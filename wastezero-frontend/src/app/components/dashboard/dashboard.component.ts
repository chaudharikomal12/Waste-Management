import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { ApiService } from '../../services/api.service';
import { MatSnackBar } from '@angular/material/snack-bar';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent implements OnInit {
  user: any;
  role = '';
  stats: any = {};
  pickups: any[] = [];
  opportunities: any[] = [];
  assignedPickups: any[] = [];
  impact: any = { totalCompleted: 0, breakdown: [] };
  recentActivities: any[] = [];
  loading = true;

  constructor(
    private auth: AuthService,
    private api: ApiService,
    private snack: MatSnackBar,
    private router: Router
  ) {}

  ngOnInit() {
    this.user = this.auth.getUser();
    this.role = this.auth.getUserRole();
    this.loadData();
  }

  loadData() {
    if (this.role === 'user') {
      this.api.getMyPickups().subscribe({
        next: (data: any) => {
          this.pickups = data;
          this.stats = {
            total: data.length,
            completed: data.filter((p: any) => p.status === 'completed').length,
            pending: data.filter((p: any) => p.status === 'open').length,
            accepted: data.filter((p: any) => p.status === 'accepted').length,
          };
          this.loading = false;
        },
        error: () => this.loading = false
      });
      this.api.getMyImpact().subscribe((data: any) => this.impact = data);
    } else if (this.role === 'volunteer') {
      this.api.getOpenPickups().subscribe({
        next: (data: any) => {
          this.opportunities = data;
          this.loading = false;
        },
        error: () => this.loading = false
      });
      this.loadAssignedPickups();
    } else if (this.role === 'admin') {
      this.api.getAdminStats().subscribe({
        next: (data: any) => {
          this.stats = data;
          this.loading = false;
        },
        error: () => this.loading = false
      });
      this.api.getAdminLogs().subscribe((data: any) => {
        this.recentActivities = data.slice(0, 8);
      });
    }
  }

  loadAssignedPickups() {
    this.api.getAssignedPickups().subscribe((data: any) => {
      this.assignedPickups = data;
      this.stats = {
        assigned: data.length,
        completed: data.filter((p: any) => p.status === 'completed').length,
      };
    });
  }

  scrollToAssigned() {
    const el = document.getElementById('assigned-section');
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  }

  startChatWith(userId: any) {
    if (!userId) return;
    // Navigate to messages — the new-message picker will be pre-filtered
    this.router.navigate(['/messages']);
  }

  acceptPickup(pickup: any) {
    pickup._accepting = true;
    this.api.acceptPickup(pickup._id).subscribe({
      next: () => {
        this.snack.open('Pickup accepted! It has moved to your Assigned Pickups.', 'Close', { duration: 3000 });
        this.opportunities = this.opportunities.filter(p => p._id !== pickup._id);
        this.loadAssignedPickups();
      },
      error: (err: any) => {
        this.snack.open(err.error?.message || 'Failed to accept pickup', 'Close', { duration: 3000 });
        pickup._accepting = false;
      }
    });
  }

  completePickup(pickup: any) {
    pickup._completing = true;
    this.api.completePickup(pickup._id).subscribe({
      next: () => {
        this.snack.open('Pickup marked as completed!', 'Close', { duration: 3000 });
        pickup.status = 'completed';
        pickup._completing = false;
        this.loadAssignedPickups();
      },
      error: (err: any) => {
        this.snack.open(err.error?.message || 'Failed to complete pickup', 'Close', { duration: 3000 });
        pickup._completing = false;
      }
    });
  }
}