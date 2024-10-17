import { ActivatedRoute, Params, Router } from '@angular/router';
import { Injectable } from '@angular/core';
import { QueryParamType } from '../models/column';
import { Observable } from 'rxjs';



@Injectable({
  providedIn: 'root'
})
export class QueryParamsService {

  queryParams$: Observable<Params>;

  constructor(private router: Router, private route: ActivatedRoute) {
    this.queryParams$ = this.route.queryParams;
  }

  getQueryParams() {
    return this.router.parseUrl(this.router.url).queryParams;
  }

  addQueryParams(params: QueryParamType) {
    this.router.navigate([], { queryParams: params, queryParamsHandling: 'merge' });
  }

  clearQueryParams() {
    this.router.navigate([], { queryParams: {} });
  }

}
