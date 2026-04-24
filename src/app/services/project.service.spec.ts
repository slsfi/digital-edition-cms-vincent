import { TestBed } from '@angular/core/testing';

import { ApiService } from './api.service';
import { ProjectService } from './project.service';

describe('ProjectService', () => {
  let service: ProjectService;
  let environment: string;

  function configureTestingModule() {
    const apiService = {
      get environment() {
        return environment;
      },
      get prefixedUrl() {
        return `${environment}digitaledition`;
      }
    };

    TestBed.configureTestingModule({
      providers: [
        ProjectService,
        { provide: ApiService, useValue: apiService }
      ]
    });
    service = TestBed.inject(ProjectService);
  }

  beforeEach(() => {
    localStorage.clear();
    environment = 'https://api.sls.fi/';
    configureTestingModule();
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('stores selected projects together with the current environment', () => {
    service.setSelectedProject('project-a');

    expect(JSON.parse(localStorage.getItem('selected_project') ?? '{}')).toEqual({
      environment: 'https://api.sls.fi/',
      project: 'project-a'
    });
  });

  it('restores a stored project only for the matching environment and allowed project list', () => {
    service.setSelectedProject('project-a');
    service.setSelectedProject(null, { persist: false });

    const restoredProject = service.restoreSelectedProjectForEnvironment('https://api.sls.fi/', ['project-a']);

    expect(restoredProject).toBe('project-a');
    expect(service.getCurrentProject()).toBe('project-a');
  });

  it('does not restore a stored project for a different environment', () => {
    service.setSelectedProject('project-a');
    service.setSelectedProject(null, { persist: false });

    const restoredProject = service.restoreSelectedProjectForEnvironment('https://testa-api.sls.fi/', ['project-a']);

    expect(restoredProject).toBeNull();
    expect(service.getCurrentProject()).toBeNull();
  });

  it('does not restore a stored project the user no longer has access to', () => {
    service.setSelectedProject('project-a');
    service.setSelectedProject(null, { persist: false });

    const restoredProject = service.restoreSelectedProjectForEnvironment('https://api.sls.fi/', ['project-b']);

    expect(restoredProject).toBeNull();
    expect(service.getCurrentProject()).toBeNull();
  });

  it('preserves persisted project selection when only the active project is cleared', () => {
    service.setSelectedProject('project-a');
    service.setSelectedProject(null, { persist: false });

    expect(service.getCurrentProject()).toBeNull();
    expect(localStorage.getItem('selected_project')).not.toBeNull();
  });
});
