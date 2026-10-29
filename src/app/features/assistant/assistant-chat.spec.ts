import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { signal } from '@angular/core';
import { vi } from 'vitest';
import { AssistantChat } from './assistant-chat';
import { Session } from '../../core/auth/session';

describe('AssistantChat privacy and lifecycle', () => {
  const companyId = signal<number | null>(1);
  const session = {
    companyId,
    user: signal({ userId: 1 }),
    roles: signal(['DRIVER']),
    superAdmin: signal(false),
  };
  let http: HttpTestingController;
  const capabilities = {
    enabled: true,
    generation: true,
    generationStatus: 'AVAILABLE',
  };

  function resolveCapabilities(overrides: Partial<typeof capabilities> = {}) {
    http
      .expectOne(`/api/companies/${companyId()}/assistant/capabilities`)
      .flush({ ...capabilities, ...overrides });
  }

  beforeEach(() => {
    companyId.set(1);
    TestBed.configureTestingModule({
      imports: [AssistantChat],
      providers: [
        provideRouter([]),
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: Session, useValue: session },
      ],
    });
    http = TestBed.inject(HttpTestingController);
  });
  afterEach(() => http.verify());

  async function create() {
    const fixture = TestBed.createComponent(AssistantChat);
    await fixture.whenStable();
    fixture.componentInstance.toggle();
    resolveCapabilities();
    await fixture.whenStable();
    return fixture;
  }

  it('opens from the floating launcher and discards context on close', async () => {
    const fixture = await create();
    const chat = fixture.componentInstance;
    chat.draft = 'Mi pregunta';
    chat.send();
    const request = http.expectOne('/api/companies/1/assistant/messages');
    expect(request.request.body.context).toEqual([]);
    request.flush({ text: 'Respuesta', sources: [], consultedAt: 'now', generated: true });
    expect(chat.messages().length).toBe(2);
    chat.close();
    chat.toggle();
    resolveCapabilities();
    expect(chat.messages()).toEqual([]);
    chat.draft = 'Otra conversación';
    chat.send();
    const next = http.expectOne('/api/companies/1/assistant/messages');
    expect(next.request.body.context).toEqual([]);
    next.flush({ text: 'Nueva respuesta', sources: [], consultedAt: 'now', generated: true });
  });

  it('cancels in-flight requests when closed', async () => {
    const fixture = await create();
    fixture.componentInstance.draft = 'Viajes';
    fixture.componentInstance.send();
    const request = http.expectOne('/api/companies/1/assistant/messages');
    fixture.componentInstance.close();
    expect(request.cancelled).toBe(true);
    expect(fixture.componentInstance.messages()).toEqual([]);
    expect(fixture.componentInstance.busy()).toBe(false);
  });

  it('preserves a failed question and retries without duplicate messages', async () => {
    const fixture = await create();
    const chat = fixture.componentInstance;
    chat.draft = 'Consultar viajes';
    chat.send();
    http
      .expectOne('/api/companies/1/assistant/messages')
      .flush({ message: 'Proveedor no disponible' }, { status: 503, statusText: 'Unavailable' });
    expect(chat.draft).toBe('Consultar viajes');
    expect(chat.messages()).toEqual([]);
    expect(chat.busy()).toBe(false);
    chat.send();
    http
      .expectOne('/api/companies/1/assistant/messages')
      .flush({ text: 'Recuperado', sources: [], generated: true });
    expect(chat.messages()).toHaveLength(2);
    expect(chat.error()).toBe('');
  });

  it('bounds temporary context before sending it', async () => {
    const fixture = await create();
    const chat = fixture.componentInstance;
    chat.messages.set(
      Array.from({ length: 14 }, () => ({ role: 'user' as const, text: 'x'.repeat(6000) })),
    );
    chat.draft = 'Seguimiento';
    chat.send();
    const request = http.expectOne('/api/companies/1/assistant/messages');
    expect(request.request.body.context).toHaveLength(6);
    expect(
      request.request.body.context.every((turn: { text: string }) => turn.text.length === 2000),
    ).toBe(true);
    request.flush({ text: 'Respuesta', sources: [], generated: true });
  });

  it('resets when the active company changes', async () => {
    const fixture = await create();
    fixture.componentInstance.messages.set([{ role: 'user', text: 'Empresa uno' }]);
    companyId.set(2);
    await fixture.whenStable();
    expect(fixture.componentInstance.open()).toBe(false);
    expect(fixture.componentInstance.messages()).toEqual([]);
  });

  it('sends only the current temporary conversation for follow-ups', async () => {
    const fixture = await create();
    fixture.componentInstance.messages.set([
      { role: 'user', text: 'Registrar viaje' },
      { role: 'assistant', text: 'Pasos' },
    ]);
    fixture.componentInstance.draft = '¿Qué campos?';
    fixture.componentInstance.send();
    const request = http.expectOne('/api/companies/1/assistant/messages');
    expect(request.request.body.context).toHaveLength(2);
    request.flush({ text: 'Campos', sources: [], consultedAt: 'now', generated: true });
  });

  it('never writes conversation content to browser storage', async () => {
    const local = vi.spyOn(Storage.prototype, 'setItem');
    const fixture = await create();
    fixture.componentInstance.messages.set([{ role: 'user', text: 'privado' }]);
    fixture.componentInstance.close();
    expect(local).not.toHaveBeenCalled();
    local.mockRestore();
  });

  it('announces an unavailable provider reported by the backend', async () => {
    const fixture = TestBed.createComponent(AssistantChat);
    await fixture.whenStable();
    fixture.componentInstance.toggle();
    resolveCapabilities({ generationStatus: 'UNAVAILABLE' });
    await fixture.whenStable();
    expect(fixture.componentInstance.status()).toContain('no disponible');
    expect(fixture.nativeElement.textContent).toContain('no disponible');
  });

  it('announces a disabled assistant without sending questions', async () => {
    const fixture = TestBed.createComponent(AssistantChat);
    await fixture.whenStable();
    fixture.componentInstance.toggle();
    resolveCapabilities({ enabled: false, generation: false, generationStatus: 'DISABLED' });
    await fixture.whenStable();
    const chat = fixture.componentInstance;
    expect(chat.status()).toContain('deshabilitado');
    chat.draft = 'Consulta bloqueada';
    chat.send();
    http.expectNone('/api/companies/1/assistant/messages');
  });

  it('cancels capability detection on close', async () => {
    const fixture = TestBed.createComponent(AssistantChat);
    await fixture.whenStable();
    fixture.componentInstance.toggle();
    const request = http.expectOne('/api/companies/1/assistant/capabilities');
    fixture.componentInstance.close();
    expect(request.cancelled).toBe(true);
  });
});
