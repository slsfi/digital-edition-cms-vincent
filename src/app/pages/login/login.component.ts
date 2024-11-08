import { LoadingService } from './../../services/loading.service';
import { ApiService } from './../../services/api.service';
import { Component, OnDestroy, OnInit, signal } from '@angular/core';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';
import { MatIconModule } from '@angular/material/icon';
import { AbstractControl, FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Subscription } from 'rxjs';
import { AuthService } from '../../services/auth.service';
import { LoadingSpinnerComponent } from '../../components/loading-spinner/loading-spinner.component';

const requiredIfEnvironmentIsCustom = function(control: AbstractControl) {
  const form = control.parent as FormGroup;
  if (form?.get('environment')?.value === ' ' && !control.value) {
    return Validators.required(control);
  }
  return null;
}

@Component({
  selector: 'login',
  standalone: true,
  imports: [MatFormFieldModule, MatInputModule, MatButtonModule, MatSelectModule, ReactiveFormsModule, CommonModule, MatIconModule, LoadingSpinnerComponent],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss'
})
export class LoginComponent implements OnInit, OnDestroy {
  constructor(private apiService: ApiService, private authService: AuthService, private loadingService: LoadingService) {
    this.loading$ = this.loadingService.loading$;
  }

  valueChanges: Subscription = new Subscription();

  loading$;

  ngOnInit() {
    this.valueChanges = this.environment.valueChanges.subscribe(() => {
      this.customEnvironment.updateValueAndValidity()
    });
  }

  ngOnDestroy() {
    this.valueChanges.unsubscribe();
  }

  environments = [
    {value: 'https://api.sls.fi/', name: 'Production'},
    {value: 'https://granska-api.sls.fi/', name: 'Staging'},
    {value: 'https://testa-api.sls.fi/', name: 'Development'},
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

  togglePasswordVisibility(event: MouseEvent) {
    this.hidePassword.set(!this.hidePassword());
    event.preventDefault();
  }

  onSubmit(event: Event) {
    event.preventDefault();
    const {email, password, environment, customEnvironment} = this.loginForm.value;
    const env = environment === ' ' ? customEnvironment : environment;
    this.apiService.setEnvironment(env);
    this.authService.login(email, password);
  }

}
