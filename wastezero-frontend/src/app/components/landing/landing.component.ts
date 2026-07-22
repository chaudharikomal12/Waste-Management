import { Component } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-landing',
  templateUrl: './landing.component.html',
  styleUrls: ['./landing.component.css']
})
export class LandingComponent {
  constructor(private router: Router) {}

  goToRegister() { this.router.navigate(['/register']); }
  goToLogin() { this.router.navigate(['/login']); }

  stats = [
    { number: '10,000+', label: 'Waste Pickups Completed' },
    { number: '2,500+', label: 'Active Volunteers' },
    { number: '50+', label: 'Cities Covered' },
    { number: '500 Tons', label: 'Waste Recycled' },
  ];

  features = [
    {
      icon: 'schedule',
      title: 'Easy Pickup Scheduling',
      desc: 'Schedule a waste pickup in minutes. Choose your waste type, address, and preferred time — we handle the rest.'
    },
    {
      icon: 'volunteer_activism',
      title: 'Volunteer Network',
      desc: 'A growing network of trained volunteers ready to collect waste from your doorstep and deliver it for recycling.'
    },
    {
      icon: 'track_changes',
      title: 'Real-Time Tracking',
      desc: 'Track your pickup status from Open to Accepted to Completed. Stay informed at every step.'
    },
    {
      icon: 'chat',
      title: 'Direct Messaging',
      desc: 'Communicate directly with your assigned volunteer for pickup coordination — all within the platform.'
    },
    {
      icon: 'bar_chart',
      title: 'My Impact Dashboard',
      desc: 'See your personal recycling stats broken down by waste category. Know exactly how much you\'ve contributed.'
    },
    {
      icon: 'admin_panel_settings',
      title: 'Admin Monitoring',
      desc: 'Full platform oversight — manage users, volunteers, opportunities, and generate detailed reports.'
    },
  ];

  howItWorks = [
    { step: '01', title: 'Register', desc: 'Create an account as a Citizen, Volunteer, or Admin in under a minute.' },
    { step: '02', title: 'Schedule Pickup', desc: 'Citizens fill in waste details, address, and preferred date/time.' },
    { step: '03', title: 'Volunteer Accepts', desc: 'A nearby volunteer sees the request and accepts it.' },
    { step: '04', title: 'Waste Collected', desc: 'Volunteer collects the waste and marks the request as completed.' },
  ];

  wasteTypes = [
    { icon: '🧴', label: 'Plastic' },
    { icon: '🌿', label: 'Organic' },
    { icon: '💻', label: 'E-waste' },
    { icon: '🔩', label: 'Metal' },
    { icon: '📄', label: 'Paper' },
    { icon: '🍶', label: 'Glass' },
  ];
}
