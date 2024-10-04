import { ApiService } from './../../services/api.service';
import { Component, signal } from '@angular/core';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';
import { MatIconModule } from '@angular/material/icon';
import { AbstractControl, FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Subscription } from 'rxjs';
import { AuthService } from '../../services/auth.service';

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
  imports: [MatFormFieldModule, MatInputModule, MatButtonModule, MatSelectModule, ReactiveFormsModule, CommonModule, MatIconModule],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss'
})
export class LoginComponent {
  constructor(private apiService: ApiService, private authService: AuthService) {
  }

  valueChanges: Subscription = new Subscription();

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
    {value: '/testing/', name: 'Development'},
    {value: ' ', name: 'Custom'}
  ];

  loginForm: FormGroup = new FormGroup({
    // FIXME: remove default values
    email: new FormControl('tomi@identio.fi', {nonNullable: true, validators: [Validators.required]}),
    password: new FormControl('identio', {nonNullable: true, validators: [Validators.required]}),
    environment: new FormControl('/testing/', {nonNullable: true, validators: [Validators.required]}),
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
