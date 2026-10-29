import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { timeout } from 'rxjs';

export interface AssistantCapabilities {
  enabled: boolean;
  generation: boolean;
  generationStatus?: 'AVAILABLE' | 'UNAVAILABLE' | 'UNVERIFIED' | 'UNCONFIGURED' | 'DISABLED';
}

export interface AssistantSource {
  id: string;
  title: string;
  version: number;
  excerpt: string;
}

export interface AssistantMessage {
  role: 'user' | 'assistant';
  text: string;
  sources?: AssistantSource[];
  consultedAt?: string;
}

interface AssistantAnswer {
  text: string;
  sources: AssistantSource[];
  consultedAt: string;
  generated: boolean;
}

@Injectable({ providedIn: 'root' })
export class AssistantApi {
  private readonly http = inject(HttpClient);

  capabilities(company: number) {
    return this.http
      .get<AssistantCapabilities>(`/api/companies/${company}/assistant/capabilities`)
      .pipe(timeout(10000));
  }

  send(
    company: number,
    question: string,
    context: Pick<AssistantMessage, 'role' | 'text'>[],
    screen: string,
    errorStatus?: number,
  ) {
    return this.http
      .post<AssistantAnswer>(`/api/companies/${company}/assistant/messages`, {
        question,
        context,
        screen,
        errorStatus,
      })
      .pipe(timeout(90000));
  }
}
