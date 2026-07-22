import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ApiService } from '../../services/api.service';

@Component({
  selector: 'app-schedule-pickup',
  templateUrl: './schedule-pickup.component.html',
  styleUrls: ['./schedule-pickup.component.css']
})
export class SchedulePickupComponent {
  pickupForm: FormGroup;
  loading = false;
  submitted = false;
  myPickups: any[] = [];

  wasteTypes = ['Plastic', 'Organic', 'E-waste', 'Metal', 'Paper', 'Glass', 'Mixed'];

  constructor(private fb: FormBuilder, private api: ApiService, private snack: MatSnackBar) {
    this.pickupForm = this.fb.group({
      wasteType: ['', Validators.required],
      wasteDescription: [''],
      estimatedQuantity: ['', Validators.required],
      pickupAddress: ['', Validators.required],
      preferredDate: ['', Validators.required],
      preferredTime: ['', Validators.required],
      contactDetails: ['']
    });
    this.loadPickups();
  }

  loadPickups() {
    this.api.getMyPickups().subscribe((data: any) => this.myPickups = data);
  }

  onSubmit() {
    if (this.pickupForm.invalid) return;
    this.loading = true;
    this.api.createPickup(this.pickupForm.value).subscribe({
      next: () => {
        this.snack.open('Pickup scheduled successfully!', 'Close', { duration: 3000 });
        this.pickupForm.reset();
        this.loadPickups();
        this.loading = false;
      },
      error: (err) => {
        this.snack.open(err.error?.message || 'Failed to schedule pickup', 'Close', { duration: 3000 });
        this.loading = false;
      }
    });
  }
}
