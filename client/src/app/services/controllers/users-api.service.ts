import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '../api/api.service';
import { API } from '../../core/config/api.config';
import { User, UpdateUserRequest } from '../../core/models/user.model';

@Injectable({ providedIn: 'root' })
export class UsersApiService {
  constructor(private apiService: ApiService) {}

  public getAllUsers(): Observable<User[]> {
    return this.apiService.get<User[]>(API.users.getAll, {
      retryCount: 2,
      retryDelay: 1500,
      cache: true,
    });
  }

  public getUserById(userId: string): Observable<User> {
    return this.apiService.get<User>(`${API.users.getAll}/{id}`, {
      routeParams: { id: userId },
    });
  }

  public getCurrentUser(): Observable<User> {
    return this.apiService.get<User>(`${API.users.getAll}/me`);
  }

  public updateUser(userId: string, request: UpdateUserRequest): Observable<User> {
    return this.apiService.put<User>(`${API.users.getAll}/{id}`, request, {
      routeParams: { id: userId },
    });
  }

  public deleteUser(userId: string): Observable<void> {
    return this.apiService.delete<void>(`${API.users.getAll}/{id}`, {
      routeParams: { id: userId },
    });
  }
}
