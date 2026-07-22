import { Component, OnInit } from '@angular/core';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-sidebar',
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.css']
})
export class SidebarComponent implements OnInit {
  role = '';

  userLinks = [
    { path: '/dashboard', icon: 'dashboard', label: 'Dashboard' },
    { path: '/schedule-pickup', icon: 'recycling', label: 'Schedule Pickup' },
    { path: '/messages', icon: 'chat', label: 'Messages' },
    { path: '/profile', icon: 'person', label: 'My Profile' },
  ];

  volunteerLinks = [
    { path: '/dashboard', icon: 'dashboard', label: 'Dashboard' },
    { path: '/opportunities', icon: 'volunteer_activism', label: 'Opportunities' },
    { path: '/messages', icon: 'chat', label: 'Messages' },
    { path: '/profile', icon: 'person', label: 'Profile' },
  ];

  adminLinks = [
    { path: '/admin', icon: 'admin_panel_settings', label: 'Admin Panel' },
    { path: '/opportunities', icon: 'volunteer_activism', label: 'Opportunities' },
    { path: '/messages', icon: 'chat', label: 'Messages' },
    { path: '/profile', icon: 'person', label: 'Profile' },
  ];

  get links() {
    if (this.role === 'user') return this.userLinks;
    if (this.role === 'volunteer') return this.volunteerLinks;
    return this.adminLinks;
  }

  constructor(private auth: AuthService) {}
  ngOnInit() { this.role = this.auth.getUserRole(); }
}
