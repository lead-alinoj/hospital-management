import { Injectable, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
import { tap } from 'rxjs/operators';
import { LoginRequest, RegisterRequest, AuthResponse, User, UserRole } from '../models/user.model';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
private apiUrl = environment.apiUrl;
  
  private currentUserSubject = new BehaviorSubject<User | null>(null);
  currentUser$ = this.currentUserSubject.asObservable();

  // HMS Role computed properties
  isAdmin = computed(() => this.hasRole('Admin'));
  isDoctor = computed(() => this.hasRole('Doctor'));
  isNurse = computed(() => this.hasRole('Nurse'));
  isReception = computed(() => this.hasRole('Reception'));
  isPharmacy = computed(() => this.hasRole('Pharmacy'));
  
  isMedicalStaff = computed(() => this.hasAnyRole(['Doctor', 'Nurse']));
  isNonMedicalStaff = computed(() => this.hasAnyRole(['Admin', 'Reception', 'Pharmacy']));

  constructor(private http: HttpClient) {
    this.loadUserFromStorage();
  }

  private loadUserFromStorage(): void {
    const token = localStorage.getItem('hms_token');
    const userStr = localStorage.getItem('hms_user');
    
    if (token && userStr) {
      try {
        const user = JSON.parse(userStr);
        this.currentUserSubject.next(user);
      } catch {
        this.clearStorage();
      }
    }
  }

  login(credentials: LoginRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/auth/login`, credentials)
      .pipe(
        tap(response => {
          if (response.success && response.token) {
            this.setAuthData(response.token, response.user);
            this.currentUserSubject.next(response.user);
          }
        })
      );
  }

  register(userData: RegisterRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/auth/register`, userData);
  }

  getToken(): string | null {
    return localStorage.getItem('hms_token');
  }

  isAuthenticated(): boolean {
    return !!this.getToken();
  }

  getCurrentUser(): User | null {
    const userStr = localStorage.getItem('hms_user');
    if (userStr) {
      try {
        return JSON.parse(userStr);
      } catch {
        return null;
      }
    }
    return null;
  }

  getUserRole(): UserRole | null {
    const user = this.getCurrentUser();
    return user ? user.role : null;
  }

  hasRole(role: UserRole): boolean {
    const userRole = this.getUserRole();
    return userRole === role;
  }

  hasAnyRole(roles: UserRole[]): boolean {
    const userRole = this.getUserRole();
    return userRole ? roles.includes(userRole) : false;
  }

  logout(): void {
    this.clearStorage();
    this.currentUserSubject.next(null);
  }

  private setAuthData(token: string, user: User): void {
    localStorage.setItem('hms_token', token);
    localStorage.setItem('hms_user', JSON.stringify(user));
    this.currentUserSubject.next(user);
  }

  private clearStorage(): void {
    localStorage.removeItem('hms_token');
    localStorage.removeItem('hms_user');
  }

  getDashboardRoute(): string {
    const role = this.getUserRole();
    switch(role) {
      case 'Admin': return '/admin/dashboard';
      case 'Doctor': return '/doctor/dashboard';
      case 'Nurse': return '/nurse/dashboard';
      case 'Reception': return '/reception/dashboard';
      case 'Pharmacy': return '/pharmacy/dashboard';
      default: return '/unauthorized';
    }
  }

  getDisplayName(): string {
    const user = this.getCurrentUser();
    if (!user) return '';
    return user.name.length > 15 ? user.name.substring(0, 15) + '...' : user.name;
  }

  // ============ ADMIN METHODS ============

  // Get all users
  getAllUsers(): Observable<any> {
    return this.http.get(`${this.apiUrl}/auth/admin/users`);
  }

  // Create new user
  createUser(userData: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/auth/admin/users`, userData);
  }

  // Update user details
  updateUser(userId: string, updates: any): Observable<any> {
    return this.http.put(`${this.apiUrl}/auth/admin/users/${userId}`, updates);
  }
updateUserStatus(userId: string, status: string) {
  return this.http.patch(
    `${this.apiUrl}/auth/admin/users/${userId}/block`,
    { blocked: status === 'Blocked' }
  );
}

  // Toggle user active/inactive
  toggleUserActive(userId: string, isActive: boolean): Observable<any> {
    return this.http.patch(`${this.apiUrl}/auth/admin/users/${userId}/active`, { isActive });
  }

  // Block/Unblock user
  blockUser(userId: string, blocked: boolean): Observable<any> {
    return this.http.patch(`${this.apiUrl}/auth/admin/users/${userId}/block`, { blocked });
  }

  // Reset user password
  resetUserPassword(userId: string, newPassword: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/auth/admin/users/${userId}/reset-password`, { newPassword });
  }

  // Delete user
  deleteUser(userId: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/auth/admin/users/${userId}`);
  }

  // Update user role
  updateUserRole(userId: string, role: UserRole): Observable<any> {
    return this.http.patch(`${this.apiUrl}/admin/users/${userId}/role`, { role });
  }

  // Search users
  searchUsers(query: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/admin/users/search`, { params: { query } });
  }
getDoctorDisplayName(doctor: User): string {
  if (!doctor) return '';
  const name = doctor.name;
  const specialization = doctor.specialization ? ` — ${doctor.specialization}` : '';
  return `Dr. ${name}${specialization}`;
}

  // Get user by ID
  getUserById(userId: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/admin/users/${userId}`);
  }

  // Get user status
  getUserStatus(): string {
    const user = this.getCurrentUser();
    if (!user) return '';
    
    if (!user.isActive) return 'Pending Approval';
    if (!user.role) return 'Pending Role Assignment';
    return 'Active';
  }

  // ============ USER PROFILE METHODS ============

  // Update current user profile
  updateProfile(updates: any): Observable<any> {
    const user = this.getCurrentUser();
    if (!user) {
      throw new Error('No user logged in');
    }
    return this.http.put(`${this.apiUrl}/users/profile`, updates);
  }

  // Change password
  changePassword(currentPassword: string, newPassword: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/users/change-password`, {
      currentPassword,
      newPassword
    });
  }

  // ============ UTILITY METHODS ============

  // Check if user has permission for a specific action
// Update the hasPermission method in auth.service.ts
hasPermission(permission: string): boolean {
  const user = this.getCurrentUser();
  if (!user || !user.role) return false;
  
  // Define role-based permissions
  const permissions: Record<UserRole, string[]> = {
    'Admin': ['manage_users', 'view_all', 'edit_all', 'delete_all', 'manage_system'],
    'Doctor': ['view_patients', 'edit_patients', 'prescribe_medication', 'view_records'],
    'Nurse': ['view_patients', 'update_vitals', 'administer_medication', 'view_records'],
    'Reception': ['register_patients', 'schedule_appointments', 'view_appointments', 'billing'],
    'Pharmacy': ['view_prescriptions', 'dispense_medication', 'manage_inventory']
  };

  const rolePermissions = permissions[user.role] || [];
  return rolePermissions.includes(permission);
}

  // Refresh user data from server
  refreshUserData(): Observable<any> {
    return this.http.get(`${this.apiUrl}/auth/me`).pipe(
      tap((response: any) => {
        if (response.success && response.user) {
          this.setAuthData(this.getToken() || '', response.user);
        }
      })
    );
  }
getDoctors(): Observable<User[]> {
  return this.http.get<User[]>(`${this.apiUrl}/auth/users/doctors`);
}

  // Validate token
  validateToken(): Observable<any> {
    return this.http.get(`${this.apiUrl}/auth/validate-token`);
  }
}