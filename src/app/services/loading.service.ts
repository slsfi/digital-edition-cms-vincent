import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class LoadingService {

  private counter = 0;

  private loadingSubject = new BehaviorSubject<boolean>(false);

  loading$ = this.loadingSubject.asObservable();

  loadingOn() {
    this.counter++;
    if (this.counter > 0) {
      this.loadingSubject.next(true);
    }
  }

  loadingOff() {
    this.counter--;
    if (this.counter === 0) {
      this.loadingSubject.next(false);
    }
  }

  constructor() { }
}
