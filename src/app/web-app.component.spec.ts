/**
 * Copyright since 2025 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { Component, Input } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatDialog } from '@angular/material/dialog';
import { provideRouter } from '@angular/router';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { TranslateModule } from '@ngx-translate/core';
import { of } from 'rxjs';

import { WebAppComponent } from './web-app.component';

/* Override the heavy template to avoid instantiating child components.
   The component's class methods are what we test here. */

@Component({ selector: 'mifosx-web-app', template: '' })
class StubWebAppComponent {
  dialog = {} as any;
  router = { navigate: jest.fn() } as any;
  translateService = { use: jest.fn() } as any;
  snackBar = { open: jest.fn() } as any;
  alertService = { alert: jest.fn() } as any;
  settingsService = {} as any;
  authenticationService = { logout: jest.fn(() => of(true)) } as any;
  themingService = {} as any;
  dateUtils = {} as any;
  idle = {} as any;
  documentationLinks = {} as any;
}

describe('WebAppComponent — logout confirmation gate', () => {
  let fixture: ComponentFixture<WebAppComponent>;
  let component: WebAppComponent;

  const mockDialogOpen = jest
    .fn()
    .mockReturnValue({ afterClosed: jest.fn().mockReturnValue(of(true)) });

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [WebAppComponent, TranslateModule.forRoot()],
      providers: [
        { provide: MatDialog, useValue: { open: mockDialogOpen } },
        { provide: provideRouter, useValue: [] },
        { provide: provideAnimationsAsync },
      ],
    })
      .overrideComponent(WebAppComponent, {
        remove: {},
        add: {
          imports: [],
          template: ''
        },
      })
      .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(WebAppComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('confirmLogout opens the dialog and calls logout on true', () => {
    component.confirmLogout();
    expect(mockDialogOpen).toHaveBeenCalledWith(WebAppComponent);
    expect(mockDialogOpen).toHaveBeenCalledTimes(1);
    // afterClosed resolves true → logout called
    expect(component.logout).toHaveBeenCalledTimes(1);
  });

  it('stays logged in when dialog is confirmed false', () => {
    (mockDialogOpen as jest.Mock).mockReturnValueOnce({
      afterClosed: jest.fn().mockReturnValue(of(false)),
    });
    component.confirmLogout();
    expect(component.logout).not.toHaveBeenCalled();
  });

  it('stays logged in when dialog is dismissed (undefined)', () => {
    (mockDialogOpen as jest.Mock).mockReturnValueOnce({
      afterClosed: jest.fn().mockReturnValue(of(undefined)),
    });
    component.confirmLogout();
    expect(component.logout).not.toHaveBeenCalled();
  });

  it('keyboard shortcut Ctrl+L triggers confirmLogout (via onKeydownHandler)', () => {
    // Simulate Ctrl+L keydown - create a KeyboardEvent-compatible object
    const keydownEvent = {
      ctrlKey: true,
      shiftKey: false,
      altKey: false,
      key: 'l',
      preventDefault: jest.fn(),
      charCode: 0,
      code: 'l',
      keyCode: 76,
      location: 0,
      metaKey: false,
      repeat: false,
      getModifierState: () => false,
    } as any;

    // buttonConfig must contain a logout combo; set it manually
    component.buttonConfig = {
      buttonCombinations: [
        {
          title: 'Logout',
          ctrlKey: true,
          shiftKey: false,
          altKey: false,
          key: 'l',
          route: '',
          id: 'logout',
        },
      ],
    } as any;

    component.onKeydownHandler(keydownEvent as any);
    expect(mockDialogOpen).toHaveBeenCalledWith(WebAppComponent);
    expect(component.logout).toHaveBeenCalledTimes(1);
  });

  it('session timeout auto path still calls logout directly (no dialog)', () => {
    // The session timeout subscription (line 288-289) calls this.logout()
    // — it should NOT be affected by the new confirmLogout gate.
    component.logout();
    expect(mockDialogOpen).not.toHaveBeenCalled();
    expect(component.logout).toHaveBeenCalledTimes(1);
  });
});