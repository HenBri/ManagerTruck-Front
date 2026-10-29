import { BreakpointObserver } from '@angular/cdk/layout';
import { CdkTrapFocus } from '@angular/cdk/a11y';
import { CdkMenu, CdkMenuItem, CdkMenuTrigger } from '@angular/cdk/menu';
import { DOCUMENT } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  effect,
  inject,
  signal,
  viewChild,
  ElementRef,
} from '@angular/core';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router, RouterLink, RouterOutlet } from '@angular/router';
import { filter, map } from 'rxjs';
import { Session } from '../../../../core/auth/session';
import { Navigation } from '../../organisms/navigation/navigation';
import { PendingChanges } from '../../../../core/auth/pending-changes';

@Component({
  selector: 'app-shell',
  imports: [
    RouterOutlet,
    RouterLink,
    Navigation,
    CdkTrapFocus,
    CdkMenu,
    CdkMenuItem,
    CdkMenuTrigger,
  ],
  templateUrl: './shell.html',
  styleUrl: './shell.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '(document:keydown.escape)': 'closeDrawer()',
    '(window:beforeunload)': 'beforeUnload($event)',
  },
})
export class Shell {
  readonly session = inject(Session);
  private readonly pending = inject(PendingChanges);
  beforeUnload(event: BeforeUnloadEvent) {
    if (this.pending.hasChanges()) {
      event.preventDefault();
      event.returnValue = '';
    }
  }
  logout() {
    if (this.pending.confirm()) this.session.logout();
  }
  private readonly document = inject(DOCUMENT);
  readonly mobile = toSignal(
    inject(BreakpointObserver)
      .observe('(max-width: 1023px)')
      .pipe(map((r) => r.matches)),
    { initialValue: false },
  );
  readonly open = signal(false);
  readonly compact = signal(this.readPreference());
  readonly menuButton = viewChild<ElementRef<HTMLButtonElement>>('menuButton');
  readonly main = viewChild<ElementRef<HTMLElement>>('main');
  readonly year = new Date().getFullYear();

  constructor() {
    effect(() => {
      this.document.body.style.overflow = this.mobile() && this.open() ? 'hidden' : '';
    });
    inject(DestroyRef).onDestroy(() => (this.document.body.style.overflow = ''));
    inject(Router)
      .events.pipe(
        filter((e) => e instanceof NavigationEnd),
        takeUntilDestroyed(),
      )
      .subscribe(() => {
        this.closeDrawer();
        this.main()?.nativeElement.focus();
      });
  }
  private readPreference() {
    try {
      return localStorage.getItem('managertruck.sidebar') === 'compact';
    } catch {
      return false;
    }
  }
  toggleMenu() {
    if (this.mobile()) this.open.update((v) => !v);
    else {
      this.compact.update((v) => !v);
      try {
        localStorage.setItem('managertruck.sidebar', this.compact() ? 'compact' : 'expanded');
      } catch {
        /* Preference storage is optional. */
      }
    }
  }
  closeDrawer() {
    if (this.open()) {
      this.open.set(false);
      this.menuButton()?.nativeElement.focus();
    }
  }
}
