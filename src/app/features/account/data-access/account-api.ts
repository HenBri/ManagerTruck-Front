import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { User } from '../../../core/auth/session';

@Injectable({ providedIn: 'root' })
export class AccountApi {
  private readonly http = inject(HttpClient);
  update(
    id: number,
    body: {
      firstName: string;
      lastName: string;
      maternalLastName: string;
      documentNumber: string;
      phone: string;
    },
  ) {
    return this.http.put<User>(`/api/users/${id}`, body);
  }
  password(id: number, body: { currentPassword: string; newPassword: string }) {
    return this.http.put<User>(`/api/users/${id}/password`, body);
  }
}
