import { TextFieldModule, type AutofillEvent } from '@angular/cdk/text-field';
import { CommonModule } from '@angular/common';
import { Component, computed, inject, OnDestroy, OnInit, signal } from '@angular/core';
import { AbstractControl, FormControl, FormGroup, ReactiveFormsModule,
         ValidationErrors, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { Subscription } from 'rxjs';

import { APP_VERSION } from '../../../config/app-version';
import { LoadingSpinnerComponent } from '../../components/loading-spinner/loading-spinner.component';
import { AuthService, LoginErrorCode } from '../../services/auth.service';
import { LoadingService } from './../../services/loading.service';
import { ApiService } from './../../services/api.service';

const CUSTOM_ENVIRONMENT_VALUE = ' ';

const requiredIfEnvironmentIsCustom = function(control: AbstractControl): ValidationErrors | null {
  const form = control.parent as FormGroup;
  if (form?.get('environment')?.value === CUSTOM_ENVIRONMENT_VALUE && !control.value?.trim()) {
    return Validators.required(control);
  }

  return null;
}

const validIfEnvironmentIsCustom = function(control: AbstractControl): ValidationErrors | null {
  const form = control.parent as FormGroup;
  if (form?.get('environment')?.value !== CUSTOM_ENVIRONMENT_VALUE) {
    return null;
  }

  return normalizeEnvironmentURL(control.value) ? null : { invalidEnvironment: true };
}

@Component({
  selector: 'login',
  imports: [
    MatFormFieldModule, MatInputModule, MatButtonModule, MatCardModule, MatSelectModule,
    ReactiveFormsModule, CommonModule, MatIconModule, TextFieldModule, LoadingSpinnerComponent
  ],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss'
})
export class LoginComponent implements OnInit, OnDestroy {
  private readonly apiService = inject(ApiService);
  private readonly authService = inject(AuthService);
  private readonly loadingService = inject(LoadingService);

  readonly loginErrorMessage = computed(() => getLoginErrorMessage(this.authService.loginError()));
  readonly loginInProgress = this.authService.loginInProgress;
  appVersion = APP_VERSION;
  loading$ = this.loadingService.loading$;
  valueChanges: Subscription = new Subscription();

  environments = [
    { value: 'https://api.sls.fi/', name: 'Production' },
    { value: 'https://granska-api.sls.fi/', name: 'Staging' },
    { value: 'https://testa-api.sls.fi/', name: 'Development' },
    { value: 'https://testa-jansson-api.sls.fi/', name: 'Jansson testa' },
    { value: 'https://testa-lukukirjat-api.sls.fi/', name: 'Lukukirjat testa' },
    { value: 'https://granska-parland-api.sls.fi/', name: 'Parland granska' },
    { value: 'https://granska-westermarck-api.sls.fi/', name: 'Westermarck granska' },
    { value: CUSTOM_ENVIRONMENT_VALUE, name: 'Custom' }
  ];

  loginForm: FormGroup = new FormGroup({
    email: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.email] }),
    password: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    environment: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    customEnvironment: new FormControl('', {
      nonNullable: true,
      validators: [requiredIfEnvironmentIsCustom, validIfEnvironmentIsCustom]
    })
  });

  hidePassword = signal(true);

  get email() {
    return this.loginForm.get('email') as FormControl;
  }

  get password() {
    return this.loginForm.get('password') as FormControl;
  }

  get environment() {
    return this.loginForm.get('environment') as FormControl;
  }

  get customEnvironment() {
    return this.loginForm.get('customEnvironment') as FormControl;
  }

  ngOnInit() {
    this.restoreStoredEnvironment();
    this.valueChanges = this.loginForm.valueChanges.subscribe(() => {
      this.customEnvironment.updateValueAndValidity({ emitEvent: false });
      this.authService.clearLoginError();
    });
  }

  ngOnDestroy() {
    this.valueChanges.unsubscribe();
  }

  togglePasswordVisibility(event: MouseEvent) {
    this.hidePassword.set(!this.hidePassword());
    event.preventDefault();
  }

  login() {
    const normalizedEmail = this.email.value.trim();
    if (normalizedEmail !== this.email.value) {
      this.email.setValue(normalizedEmail, { emitEvent: false });
      this.email.updateValueAndValidity({ emitEvent: false });
    }

    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      return;
    }

    const { password, environment, customEnvironment } = this.loginForm.getRawValue();
    const env = environment === CUSTOM_ENVIRONMENT_VALUE
      ? normalizeEnvironmentURL(customEnvironment)
      : environment;

    if (!env) {
      this.customEnvironment.markAsTouched();
      this.customEnvironment.setErrors({ invalidEnvironment: true });
      return;
    }

    if (environment === CUSTOM_ENVIRONMENT_VALUE && customEnvironment !== env) {
      this.customEnvironment.setValue(env, { emitEvent: false });
    }

    this.apiService.setEnvironment(env);
    this.authService.login(normalizedEmail, password);
  }

  /**
   * Handles Angular CDK autofill notifications for credential inputs, because
   * browser autofill can update the native input value without notifying
   * Angular's reactive form controls.
   *
   * The `CdkAutofill` directive uses `[cdkAutofill]` as its selector and exposes
   * an output with the same name. Angular includes output bindings when matching
   * directive selectors, so `(cdkAutofill)` in the template is enough to attach
   * the directive and receive autofill state changes.
   */
  syncAutofilledInput(controlName: 'email' | 'password', event: AutofillEvent): void {
    const control = this.loginForm.get(controlName) as FormControl;
    const input = event.target as HTMLInputElement;
    if (input.value !== control.value) {
      control.setValue(input.value);
    }
  }

  private restoreStoredEnvironment(): void {
    const storedEnvironment = normalizeEnvironmentURL(this.apiService.environment);
    if (!storedEnvironment) {
      return;
    }

    const predefinedEnvironment = this.environments.find((environment) => environment.value === storedEnvironment);
    if (predefinedEnvironment) {
      this.environment.setValue(predefinedEnvironment.value, { emitEvent: false });
      return;
    }

    this.environment.setValue(CUSTOM_ENVIRONMENT_VALUE, { emitEvent: false });
    this.customEnvironment.setValue(storedEnvironment, { emitEvent: false });
    this.customEnvironment.updateValueAndValidity({ emitEvent: false });
  }
}

function getLoginErrorMessage(error: LoginErrorCode | null): string | null {
  switch (error) {
    case 'no_credentials':
      return 'Enter your email address and password.';
    case 'email_not_verified':
      return 'Verify your email address before logging in.';
    case 'invalid_credentials':
      return 'Check your email address and password.';
    case 'cms_access_denied':
      return 'CMS access could not be verified for this account.';
    case 'request_failed':
      return 'Login failed. Try again.';
    default:
      return null;
  }
}

function normalizeEnvironmentURL(value: string | null | undefined): string | null {
  if (typeof value !== 'string') {
    return null;
  }

  const trimmedValue = value.trim();
  if (!trimmedValue) {
    return null;
  }

  try {
    const parsed = new URL(trimmedValue);
    if (parsed.protocol !== 'https:' || parsed.username || parsed.password) {
      return null;
    }

    parsed.hash = '';
    parsed.search = '';
    const normalizedValue = parsed.toString();
    return normalizedValue.endsWith('/') ? normalizedValue : `${normalizedValue}/`;
  } catch {
    return null;
  }
}
