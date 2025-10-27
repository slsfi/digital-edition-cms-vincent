import { CommonModule } from '@angular/common';
import { Component, inject, OnDestroy, OnInit, signal } from '@angular/core';
import { AbstractControl, FormControl, FormGroup, ReactiveFormsModule,
         Validators } from '@angular/forms';
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


const requiredIfEnvironmentIsCustom = function(control: AbstractControl) {
  const form = control.parent as FormGroup;
  if (form?.get('environment')?.value === ' ' && !control.value) {
    return Validators.required(control);
  }
  return null;
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

  appVersion = APP_VERSION;
  loading$ = this.loadingService.loading$;
  valueChanges: Subscription = new Subscription();

  environments = [
    {value: 'https://api.sls.fi/', name: 'Production'},
    {value: 'https://granska-api.sls.fi/', name: 'Staging'},
    {value: 'https://testa-api.sls.fi/', name: 'Development'},
    {value: 'https://testa-jansson-api.sls.fi/', name: 'Jansson testa'},
    {value: 'https://testa-lukukirjat-api.sls.fi/', name: 'Lukukirjat testa'},
    {value: 'https://granska-parland-api.sls.fi/', name: 'Parland granska'},
    {value: 'https://granska-westermarck-api.sls.fi/', name: 'Westermarck granska'},
    {value: ' ', name: 'Custom'}
  ];

  loginForm: FormGroup = new FormGroup({
    email: new FormControl('', {nonNullable: true, validators: [Validators.required]}),
    password: new FormControl('', {nonNullable: true, validators: [Validators.required]}),
    environment: new FormControl('', {nonNullable: true, validators: [Validators.required]}),
    customEnvironment: new FormControl('', {nonNullable: true, validators: [requiredIfEnvironmentIsCustom]})
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
    this.valueChanges = this.environment.valueChanges.subscribe(() => {
      this.customEnvironment.updateValueAndValidity()
    });
  }

  ngOnDestroy() {
    this.valueChanges.unsubscribe();
  }

  togglePasswordVisibility(event: MouseEvent) {
    this.hidePassword.set(!this.hidePassword());
    event.preventDefault();
  }

  login(event: Event) {
    event.preventDefault();
    const {email, password, environment, customEnvironment} = this.loginForm.value;
    const env = environment === ' ' ? customEnvironment : environment;
    this.apiService.setEnvironment(env);
    this.authService.login(email, password);
  }
}
