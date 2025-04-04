import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DataviewComponent } from './dataview.component';

describe('DataviewComponent', () => {
  let component: DataviewComponent;
  let fixture: ComponentFixture<DataviewComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DataviewComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DataviewComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
