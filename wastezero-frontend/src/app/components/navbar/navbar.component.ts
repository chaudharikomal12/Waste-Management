import { Component, OnInit } from '@angular/core';
import { AuthService } from '../../services/auth.service';
import { ApiService } from '../../services/api.service';

@Component({
  selector: 'app-navbar',
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.css']
})
export class NavbarComponent implements OnInit {
  user: any;
  notificationCount = 0;

  constructor(private auth: AuthService, private api: ApiService) {}

  ngOnInit() {
    this.auth.user$.subscribe(u => this.user = u);
    this.loadNotifications();
  }

  loadNotifications() {
    if (!this.auth.isLoggedIn()) return;
    this.api.getNotifications().subscribe((notifs: any) => {
      this.notificationCount = notifs.filter((n: any) => !n.isRead).length;
    });
  }

  logout() { this.auth.logout(); }
}
