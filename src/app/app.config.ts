import { ApplicationConfig, provideZoneChangeDetection } from '@angular/core';
import { provideRouter, withComponentInputBinding, withRouterConfig } from '@angular/router';

import { routes } from './app.routes';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { HTTP_INTERCEPTORS, provideHttpClient, withInterceptors } from '@angular/common/http';

import { authInterceptor } from './interceptors/auth.interceptor';
import { MAT_DATE_LOCALE } from '@angular/material/core';
import { loadingInterceptor } from './interceptors/loading.interceptor';

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes, withComponentInputBinding(), withRouterConfig({ paramsInheritanceStrategy: 'always' })),
    provideAnimationsAsync('animations'),
    provideHttpClient(
      withInterceptors([authInterceptor, loadingInterceptor]),
    ),
    { provide: MAT_DATE_LOCALE, useValue: 'en-GB' }, provideAnimationsAsync(),
  ],
};
