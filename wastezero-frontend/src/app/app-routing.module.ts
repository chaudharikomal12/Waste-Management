import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { LoginComponent } from './components/login/login.component';
import { RegisterComponent } from './components/register/register.component';
import { DashboardComponent } from './components/dashboard/dashboard.component';
import { SchedulePickupComponent } from './components/schedule-pickup/schedule-pickup.component';
import { OpportunitiesComponent } from './components/opportunities/opportunities.component';
import { MessagesComponent } from './components/messages/messages.component';
import { ProfileComponent } from './components/profile/profile.component';
import { AdminPanelComponent } from './components/admin-panel/admin-panel.component';
import { EditOpportunityComponent } from './components/edit-opportunity/edit-opportunity.component';
import { LandingComponent } from './components/landing/landing.component';
import { AuthGuard } from './guards/auth.guard';
import { RoleGuard } from './guards/role.guard';

const routes: Routes = [
  { path: '', component: LandingComponent },
  { path: 'login', component: LoginComponent },
  { path: 'register', component: RegisterComponent },
  { path: 'dashboard', component: DashboardComponent, canActivate: [AuthGuard] },
  { path: 'schedule-pickup', component: SchedulePickupComponent, canActivate: [AuthGuard, RoleGuard], data: { roles: ['user'] } },
  { path: 'opportunities', component: OpportunitiesComponent, canActivate: [AuthGuard, RoleGuard], data: { roles: ['volunteer', 'admin'] } },
  { path: 'opportunities/:id/edit', component: EditOpportunityComponent, canActivate: [AuthGuard, RoleGuard], data: { roles: ['admin'] } },
  { path: 'messages', component: MessagesComponent, canActivate: [AuthGuard] },
  { path: 'profile', component: ProfileComponent, canActivate: [AuthGuard] },
  { path: 'admin', component: AdminPanelComponent, canActivate: [AuthGuard, RoleGuard], data: { roles: ['admin'] } },
  { path: '**', redirectTo: '/login' }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
