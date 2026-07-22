import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ApiService } from '../../services/api.service';

@Component({
  selector: 'app-edit-opportunity',
  templateUrl: './edit-opportunity.component.html',
  styleUrls: ['./edit-opportunity.component.css']
})
export class EditOpportunityComponent implements OnInit {
  oppForm: FormGroup;
  loading = true;
  saving = false;
  opportunityId = '';

  constructor(
    private fb: FormBuilder,
    private api: ApiService,
    private route: ActivatedRoute,
    private router: Router,
    private snack: MatSnackBar
  ) {
    this.oppForm = this.fb.group({
      title: ['', Validators.required],
      description: ['', Validators.required],
      requiredSkills: [''],
      duration: ['', Validators.required],
      location: ['', Validators.required],
      status: ['open', Validators.required]
    });
  }

  ngOnInit() {
    this.opportunityId = this.route.snapshot.paramMap.get('id') || '';
    if (!this.opportunityId) {
      this.snack.open('No opportunity specified', 'Close', { duration: 3000 });
      this.router.navigate(['/opportunities']);
      return;
    }
    this.api.getOpportunityById(this.opportunityId).subscribe({
      next: (data: any) => {
        this.oppForm.patchValue({
          title: data.title,
          description: data.description,
          requiredSkills: (data.requiredSkills || []).join(', '),
          duration: data.duration,
          location: data.location,
          status: data.status
        });
        this.loading = false;
      },
      error: (err) => {
        this.snack.open(err.error?.message || 'Failed to load opportunity', 'Close', { duration: 3000 });
        this.router.navigate(['/opportunities']);
      }
    });
  }

  onSubmit() {
    if (this.oppForm.invalid) return;
    this.saving = true;
    const data = {
      ...this.oppForm.value,
      requiredSkills: this.oppForm.value.requiredSkills
        .split(',')
        .map((s: string) => s.trim())
        .filter((s: string) => s.length)
    };
    this.api.updateOpportunity(this.opportunityId, data).subscribe({
      next: () => {
        this.snack.open('Opportunity updated!', 'Close', { duration: 3000 });
        this.router.navigate(['/opportunities']);
      },
      error: (err) => {
        this.snack.open(err.error?.message || 'Update failed', 'Close', { duration: 3000 });
        this.saving = false;
      }
    });
  }

  cancel() {
    this.router.navigate(['/opportunities']);
  }
}
