import { inject, Injectable } from '@angular/core';
import { CanDeactivateFn } from '@angular/router';

@Injectable({ providedIn: 'root' })
export class PendingChanges {
  private check = () => false;
  register(check: () => boolean) {
    this.check = check;
    return () => {
      if (this.check === check) this.check = () => false;
    };
  }
  hasChanges() {
    return this.check();
  }
  clear() {
    this.check = () => false;
  }
  confirm() {
    return (
      !this.hasChanges() ||
      window.confirm('Hay cambios sin guardar. ¿Quieres descartarlos y continuar?')
    );
  }
}
export const pendingChangesGuard: CanDeactivateFn<unknown> = () => inject(PendingChanges).confirm();
