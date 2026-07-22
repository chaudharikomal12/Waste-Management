import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';
import { AuthService } from '../../services/auth.service';
import { ApiService } from '../../services/api.service';

@Component({
  selector: 'app-opportunities',
  templateUrl: './opportunities.component.html',
  styleUrls: ['./opportunities.component.css']
})
export class OpportunitiesComponent implements OnInit {
  role = '';
  opportunities: any[] = [];
  myApplications: any[] = [];
  loading = false;
  showCreateForm = false;
  selectedOpp: any = null;
  oppApplications: any[] = [];

  oppForm: FormGroup;

  constructor(private auth: AuthService, private api: ApiService,
    private snack: MatSnackBar, private fb: FormBuilder) {
    this.oppForm = this.fb.group({
      title: ['', Validators.required],
      description: ['', Validators.required],
      requiredSkills: [''],
      duration: ['', Validators.required],
      location: ['', Validators.required],
      status: ['open']
    });
  }

  ngOnInit() {
    this.role = this.auth.getUserRole();
    this.loadOpportunities();
    if (this.role === 'volunteer') this.loadMyApplications();
  }

  loadOpportunities() {
    this.loading = true;
    const obs = this.role === 'volunteer'
      ? this.api.getMatchedOpportunities()
      : this.api.getOpportunities();
    obs.subscribe({
      next: (data: any) => { this.opportunities = data; this.loading = false; },
      error: () => this.loading = false
    });
  }

  loadMyApplications() {
    this.api.getMyApplications().subscribe((data: any) => this.myApplications = data);
  }

  hasApplied(oppId: string): boolean {
    return this.myApplications.some((a: any) => a.opportunity_id?._id === oppId);
  }

  apply(oppId: string) {
    this.api.applyForOpportunity(oppId).subscribe({
      next: () => {
        this.snack.open('Application submitted!', 'Close', { duration: 3000 });
        this.loadMyApplications();
      },
      error: (err) => this.snack.open(err.error?.message || 'Error', 'Close', { duration: 3000 })
    });
  }

  createOpportunity() {
    if (this.oppForm.invalid) return;
    const data = { ...this.oppForm.value, requiredSkills: this.oppForm.value.requiredSkills.split(',').map((s: string) => s.trim()) };
    this.api.createOpportunity(data).subscribe({
      next: () => {
        this.snack.open('Opportunity created!', 'Close', { duration: 3000 });
        this.showCreateForm = false;
        this.oppForm.reset({ status: 'open' });
        this.loadOpportunities();
      },
      error: (err) => this.snack.open(err.error?.message || 'Error', 'Close', { duration: 3000 })
    });
  }

  deleteOpportunity(id: string) {
    if (!confirm('Delete this opportunity?')) return;
    this.api.deleteOpportunity(id).subscribe({
      next: () => { this.snack.open('Deleted', 'Close', { duration: 2000 }); this.loadOpportunities(); },
      error: (err) => this.snack.open(err.error?.message || 'Error', 'Close', { duration: 3000 })
    });
  }

  viewApplications(opp: any) {
    this.selectedOpp = opp;
    this.api.getApplicationsForOpportunity(opp._id).subscribe((data: any) => this.oppApplications = data);
  }

  updateStatus(appId: string, status: string) {
    this.api.updateApplicationStatus(appId, status).subscribe({
      next: () => {
        this.snack.open(`Application ${status}`, 'Close', { duration: 2000 });
        this.viewApplications(this.selectedOpp);
      },
      error: (err) => this.snack.open(err.error?.message || 'Error', 'Close', { duration: 3000 })
    });
  }
}
