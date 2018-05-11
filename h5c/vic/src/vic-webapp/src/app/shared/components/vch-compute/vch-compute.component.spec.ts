/*
 Copyright 2017 VMware, Inc. All Rights Reserved.

 Licensed under the Apache License, Version 2.0 (the "License");
 you may not use this file except in compliance with the License.
 You may obtain a copy of the License at

 http://www.apache.org/licenses/LICENSE-2.0

 Unless required by applicable law or agreed to in writing, software
 distributed under the License is distributed on an "AS IS" BASIS,
 WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 See the License for the specific language governing permissions and
 limitations under the License.
*/
import {ComponentFixture, TestBed} from '@angular/core/testing';

import {ClarityModule} from '@clr/angular';
import { ComputeResourceTreenodeComponent } from './compute-resource-treenode.component';
import {HttpModule} from '@angular/http';
import {Observable} from 'rxjs/Observable';
import {ReactiveFormsModule} from '@angular/forms';
import {TestScheduler} from 'rxjs/Rx';
import {CreateVchWizardService} from '../../../create-vch-wizard/create-vch-wizard.service';
import {GlobalsService} from '../../globals.service';
import {VchComputeComponent} from './vch-compute.component';
import {CapitalizePipe} from '../../pipes/capitalize.pipe';
import {ConfigureVchService} from '../../../configure/configure-vch.service';
import {HttpClientModule} from '@angular/common/http';

describe('ComputeCapacityComponent', () => {

  let component: VchComputeComponent;
  let fixture: ComponentFixture<VchComputeComponent>;
  let service: CreateVchWizardService;

  const MaxLimit = 4096;

  function setDefaultRequiredValues() {
    component.loadResources(component.clusters[0].text);
    component.selectComputeResource({datacenterObj: component.datacenter, obj: component.resources[0]});
  }

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [
        ReactiveFormsModule,
        HttpModule,
        HttpClientModule,
        ClarityModule
      ],
      providers: [
        ConfigureVchService,
        {
          provide: CreateVchWizardService,
          useValue: {
            getDatacenter() {
              return Observable.of([{
                text: 'datacenter'
              }]);
            },
            getClustersList(serviceGuid: string) {
              return Observable.of([{
                text: 'cluster'
              }]);
            },
            getResourceAllocationsInfo() {
              return Observable.of({
                cpu: {
                  maxUsage: MaxLimit,
                  unreservedForPool: MaxLimit
                },
                memory: {
                  maxUsage: MaxLimit,
                  unreservedForPool: MaxLimit
                }
              });
            },
            getHostsAndResourcePools() {
              return Observable.of([{
                text: 'cluster',
                nodeTypeId: 'DcCluster',
                aliases: ['cluster']
              }]);
            },
            getClusterVMGroups() {
              return Observable.of([]);
            },
            getClusterDrsStatus() {
              return Observable.of([]);
            }
          }
        },
        {
          provide: GlobalsService,
          useValue: {
            getWebPlatform () {
              return {
                getUserSession () {
                  return {
                    serversInfo: [{
                      name: 'server.vpshere.local',
                      serviceGuid: 'aaaa-bbb-ccc',
                      thumbprint: 'AA:BB:CC'
                    }]
                  }
                }
              }
            }
          }
        }
      ],
      declarations: [
        VchComputeComponent,
        ComputeResourceTreenodeComponent,
        CapitalizePipe
      ]
    });
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(VchComputeComponent);
    component = fixture.componentInstance;

    spyOn(component, 'onPageLoad').and.callFake(() => {
      component.clusters = [{
        text: 'cluster',
        nodeTypeId: 'DcCluster',
        aliases: ['cluster']
      }];
    });
    component.onPageLoad();

    service = fixture.debugElement.injector.get(CreateVchWizardService);

    spyOn(service, 'getDatacenter').and.callThrough();
    spyOn(service, 'getClustersList').and.callThrough();
    spyOn(service, 'getResourceAllocationsInfo').and.callThrough();
    spyOn(service, 'getHostsAndResourcePools').and.callThrough();
  });

  it('should be created', () => {
    expect(component).toBeTruthy();
  });

  it('should start with a valid form', () => {
    expect(component.form.valid).toBe(true);
  });

  it('should end with an invalid form on step commit without selecting a compute resource',  () => {
    component.onCommit();
    expect(component.form.invalid).toBe(true);
  });

  it('should end with an valid form on step commit after selecting a compute resource', () => {
    setDefaultRequiredValues();
    component.onCommit();
    expect(component.form.valid).toBe(true);
  });

  it('should validate cpu limit field', () => {
    const field = component.form.get('cpuLimit');
    let errors;

    expect(field.valid).toBeTruthy();

    // CPU Limit field is required
    field.setValue('');
    errors = field.errors || {};
    expect(errors['required']).toBeTruthy();

    // Set CPU Limit to something incorrect
    field.setValue('test');
    errors = field.errors || {};
    expect(errors['required']).toBeFalsy();
    expect(errors['pattern']).toBeTruthy();

    // Set CPU Limit to something incorrect
    field.setValue('0');
    errors = field.errors || {};
    expect(errors['pattern']).toBeFalsy();
    expect(errors['min']).toBeTruthy();

    // Set CPU Limit to something correct
    field.setValue('1');
    errors = field.errors || {};
    expect(errors['min']).toBeFalsy();

    // Validate result
    setDefaultRequiredValues();
    component.updateCurrentModel();
    component.onCommit().subscribe( r => {
      expect(r.computeCapacity.cpuLimit).toBe('1');
    });
  });

  it('should validate memory limit field', () => {
    const field = component.form.get('memoryLimit');
    let errors;

    expect(field.valid).toBeTruthy();

    // CPU Limit field is required
    field.setValue('');
    errors = field.errors || {};
    expect(errors['required']).toBeTruthy();

    // Set CPU Limit to something incorrect
    field.setValue('test');
    errors = field.errors || {};
    expect(errors['required']).toBeFalsy();
    expect(errors['pattern']).toBeTruthy();

    // Set CPU Limit to something incorrect
    field.setValue('0');
    errors = field.errors || {};
    expect(errors['pattern']).toBeFalsy();
    expect(errors['min']).toBeTruthy();

    // Set CPU Limit to something correct
    field.setValue('1');
    errors = field.errors || {};
    expect(errors['min']).toBeFalsy();

    // Validate result
    setDefaultRequiredValues();
    component.updateCurrentModel();
    component.onCommit().subscribe( r => {
      expect(r.computeCapacity.memoryLimit).toBe('1');
    });
  });

  it('should extract the datacenter moid from the object reference string', () => {
    const dc = component.getDataCenterId('urn:vmomi:Datacenter:dc-test:00000000-0000-0000-0000-000000000000');
    expect(dc).toEqual('dc-test');
  });

  it('should validate advanced fields defaults values', () => {
    component.toggleAdvancedMode();
    component.selectComputeResource({datacenterObj: component.datacenter, obj: {text: ''}});
    component.onCommit();
    expect(component.form.valid).toBe(true);

    component.form.get('cpuReservation').setValue('');
    expect(component.form.get('cpuReservation').hasError('required')).toBeTruthy();

    component.form.get('cpuReservation').setValue('test');
    expect(component.form.get('cpuReservation').hasError('pattern')).toBeTruthy();
  });
});