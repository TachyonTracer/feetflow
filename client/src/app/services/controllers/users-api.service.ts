import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { ApiService } from '../api/api.service';
import { API } from '../../core/config/api.config';
import { User, CreateUserRequest } from '../../core/models/user.model';

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
    return this.apiService.get<User>(API.users.getById, {
      routeParams: { id: userId },
    });
  }

  public createUser(createUserRequest: CreateUserRequest): Observable<User> {
    return this.apiService
      .post<User>(API.users.create, createUserRequest)
      .pipe(map((user) => ({ ...user, name: user.name.trim() })));
  }

  public updateUser(
    userId: string,
    updateUserRequest: Partial<CreateUserRequest>,
  ): Observable<User> {
    return this.apiService.put<User>(API.users.update, updateUserRequest, {
      routeParams: { id: userId },
    });
  }

  public deleteUser(userId: string): Observable<void> {
    return this.apiService.delete<void>(API.users.delete, {
      routeParams: { id: userId },
    });
  }
}
