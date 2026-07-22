import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';
import { HttpClient } from '@angular/common/http';
import { AuthService } from '../../services/auth.service';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-profile',
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.css']
})
export class ProfileComponent implements OnInit {
  user: any;
  role = '';
  profileForm: FormGroup;
  loading = false;

  constructor(private auth: AuthService, private fb: FormBuilder,
    private snack: MatSnackBar, private http: HttpClient) {
    this.profileForm = this.fb.group({
      name: ['', Validators.required],
      email: [{ value: '', disabled: true }],
      location: [''],
      skills: ['']
    });
  }

  ngOnInit() {
    this.user = this.auth.getUser();
    this.role = this.auth.getUserRole();
    this.http.get(`${environment.apiUrl}/auth/me`).subscribe((data: any) => {
      this.user = data;
      this.profileForm.patchValue({
        name: data.name,
        email: data.email,
        location: data.location,
        skills: data.skills?.join(', ')
      });
    });
  }

  onSubmit() {
    if (this.profileForm.invalid) return;
    this.loading = true;
    const payload = {
      name: this.profileForm.value.name,
      location: this.profileForm.value.location,
      skills: this.profileForm.value.skills?.split(',').map((s: string) => s.trim()).filter(Boolean)
    };
    this.http.put(`${environment.apiUrl}/auth/me`, payload).subscribe({
      next: () => {
        this.snack.open('Profile updated!', 'Close', { duration: 3000 });
        this.loading = false;
      },
      error: () => { this.snack.open('Update failed', 'Close', { duration: 3000 }); this.loading = false; }
    });
  }
}
