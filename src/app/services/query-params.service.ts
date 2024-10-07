import { Router } from '@angular/router';
import { Injectable } from '@angular/core';
import { QueryParamType } from '../models/column';



@Injectable({
  providedIn: 'root'
})
export class QueryParamsService {


  constructor(private router: Router) {

  }

  getQueryParams() {
    return this.router.parseUrl(this.router.url).queryParams;
  }

  addQueryParams(params: QueryParamType) {
    this.router.navigate([], { queryParams: params, queryParamsHandling: 'replace' });
  }

  clearQueryParams() {
    this.router.navigate([], { queryParams: {} });
  }

}
