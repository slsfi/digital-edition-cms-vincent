import { Injectable } from '@angular/core';
import { BehaviorSubject, timer } from 'rxjs';

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

  /**
   * Turn off loading spinner
   * minimum time is 0.5s
   */
  loadingOff() {
    this.counter--;
    if (this.counter <= 0) {
      const timerSubscription = timer(500).subscribe(() => {
        if (this.counter <= 0) {
          this.loadingSubject.next(false);
        }
        timerSubscription.unsubscribe();
      });
    }
  }

}
