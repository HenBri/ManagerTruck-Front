import { HttpErrorResponse } from '@angular/common/http';
import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  effect,
  inject,
  signal,
  viewChild,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Subscription, TimeoutError, timeout } from 'rxjs';
import { Session } from '../../core/auth/session';
import { AssistantContext } from './assistant-context';
import { AssistantApi, AssistantCapabilities, AssistantMessage } from './assistant-api';

@Component({
  selector: 'app-assistant-chat',
  imports: [FormsModule],
  templateUrl: './assistant-chat.html',
  styleUrl: './assistant-chat.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AssistantChat {
  readonly session = inject(Session);
  readonly context = inject(AssistantContext);
  private readonly api = inject(AssistantApi);
  private readonly router = inject(Router);
  readonly open = signal(false);
  readonly messages = signal<AssistantMessage[]>([]);
  readonly busy = signal(false);
  readonly error = signal('');
  readonly status = signal('');
  readonly capabilities = signal<AssistantCapabilities | null>(null);
  readonly input = viewChild<ElementRef<HTMLTextAreaElement>>('questionInput');
  readonly launcher = viewChild<ElementRef<HTMLButtonElement>>('launcher');
  readonly feed = viewChild<ElementRef<HTMLElement>>('feed');
  draft = '';
  private epoch = 0;
  private requests = new Subscription();

  constructor() {
    effect(() => {
      this.session.companyId();
      this.session.user();
      this.session.roles();
      this.reset();
      this.open.set(false);
      this.capabilities.set(null);
      this.context.error.set(null);
    });
    inject(DestroyRef).onDestroy(() => this.reset());
  }

  toggle() {
    if (this.open()) this.close();
    else {
      this.open.set(true);
      this.loadCapabilities();
      setTimeout(() => this.input()?.nativeElement.focus());
    }
  }

  private loadCapabilities() {
    const company = this.session.companyId();
    this.capabilities.set(null);
    if (!company) return;
    const epoch = this.epoch;
    this.requests.add(
      this.api.capabilities(company).subscribe({
        next: (capabilities) => {
          if (epoch !== this.epoch) return;
          this.capabilities.set(capabilities);
          if (!capabilities.enabled)
            this.status.set('El asistente está deshabilitado en el servidor.');
          else if (capabilities.generationStatus === 'UNAVAILABLE')
            this.status.set('Groq está temporalmente no disponible. Intenta nuevamente más tarde.');
        },
        error: () => {
          if (epoch === this.epoch)
            this.status.set(
              'No se pudo comprobar la disponibilidad del asistente. Puedes intentar una consulta escrita.',
            );
        },
      }),
    );
  }

  close() {
    this.reset();
    this.open.set(false);
    this.launcher()?.nativeElement.focus();
  }

  reset() {
    this.epoch++;
    this.requests.unsubscribe();
    this.requests = new Subscription();
    this.messages.set([]);
    this.draft = '';
    this.busy.set(false);
    this.error.set('');
    this.status.set('');
  }

  send(errorStatus?: number) {
    const question = this.draft.trim();
    const company = this.session.companyId();
    if (!question || !company || this.busy() || this.capabilities()?.enabled === false) return;
    const epoch = this.epoch;
    const history = this.messages()
      .slice(-6)
      .map(({ role, text }) => ({ role, text: text.slice(0, 2000) }));
    this.messages.update((messages) => [...messages, { role: 'user', text: question }]);
    this.draft = '';
    this.error.set('');
    this.busy.set(true);
    this.status.set('Consultando fuentes y permisos…');
    this.scroll();
    this.requests.add(
      this.api
        .send(company, question, history, this.router.url.split('?')[0].slice(0, 150), errorStatus)
        .subscribe({
          next: (answer) => {
            if (epoch !== this.epoch) return;
            this.messages.update((messages) => [
              ...messages,
              {
                role: 'assistant',
                text: answer.text,
                sources: answer.sources,
                consultedAt: answer.consultedAt,
              },
            ]);
            this.busy.set(false);
            this.status.set(answer.generated ? '' : 'Respuesta documental local');
            this.scroll();
          },
          error: (error) => {
            if (epoch !== this.epoch) return;
            this.fail(error);
            this.draft = question;
            this.messages.update((messages) => messages.slice(0, -1));
          },
        }),
    );
  }

  explainError() {
    const error = this.context.error();
    if (!error || error.companyId !== this.session.companyId() || Date.now() - error.at > 300000) {
      this.context.error.set(null);
      return;
    }
    this.draft = `Recibí un error HTTP ${error.status}. ¿Qué puede significar y qué debo revisar?`;
    this.send(error.status);
  }

  private fail(error: HttpErrorResponse | TimeoutError) {
    this.busy.set(false);
    this.status.set('');
    if (error instanceof TimeoutError) {
      this.error.set('La solicitud tardó demasiado. Tu pregunta se conserva; vuelve a intentarlo.');
      return;
    }
    const message = error.error?.message ?? error.error?.statusMsg;
    this.error.set(
      typeof message === 'string'
        ? message
        : 'No se pudo completar la solicitud. Revisa la conexión y la configuración del asistente.',
    );
  }

  private scroll() {
    setTimeout(() => {
      const feed = this.feed()?.nativeElement;
      if (feed) feed.scrollTop = feed.scrollHeight;
    });
  }
}
