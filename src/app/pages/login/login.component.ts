import { CommonModule } from '@angular/common';
import { Component, inject, OnDestroy, OnInit, signal } from '@angular/core';
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
import { AuthService } from '../../services/auth.service';
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
    ReactiveFormsModule, CommonModule, MatIconModule, LoadingSpinnerComponent
  ],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss'
})
export class LoginComponent implements OnInit, OnDestroy {
  private readonly apiService = inject(ApiService);
  private readonly authService = inject(AuthService);
  private readonly loadingService = inject(LoadingService);

  readonly loginError = this.authService.loginError;
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

    const { email, password, environment, customEnvironment } = this.loginForm.getRawValue();
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
