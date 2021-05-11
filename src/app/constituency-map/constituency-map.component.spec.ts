import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ConstituencyMapComponent } from './constituency-map.component';

describe('ConstituencyMapComponent', () => {
  let component: ConstituencyMapComponent;
  let fixture: ComponentFixture<ConstituencyMapComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ConstituencyMapComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ConstituencyMapComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
