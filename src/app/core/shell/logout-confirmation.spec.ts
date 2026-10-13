/**
 * Copyright since 2025 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { Component, Input, Output, EventEmitter } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatDialog } from '@angular/material/dialog';
import { BreakpointObserver } from '@angular/cdk/layout';
import { ChangeDetectorRef } from '@angular/core';
import { DestroyRef } from '@angular/core';
import { Router } from '@angular/router';
import { AuthenticationService } from 'app/core/authentication/authentication.service';
import { PopoverService } from 'app/configuration-wizard/popover/popover.service';
import { ConfigurationWizardService } from 'app/configuration-wizard/configuration-wizard.service';
import { DocumentationLinksService } from 'app/shared/services/documentation-links.service';
import { provideRouter } from '@angular/router';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { TranslateModule } from '@ngx-translate/core';
import { of } from 'rxjs';

import { ToolbarComponent } from 'app/core/shell/toolbar/toolbar.component';
import { SidenavComponent } from 'app/core/shell/sidenav/sidenav.component';

/* Mock providers for the heavy dependencies that toolbar/sidenav pull in. */

const mockBreakpointObserver = {
  observe: jest.fn().mockReturnValue(of({ matches: false })),
};
const mockRouter = { navigate: jest.fn() };
const mockAuthenticationService = {
  logout: jest.fn(() => of(true)),
  getCredentials: jest.fn(),
};
const mockPopoverService = { open: jest.fn() };
const mockConfigurationWizardService = {
  showToolbar: true,
  showToolbarAdmin: false,
  showSideNav: true,
  showSideNavChartofAccounts: false,
  showCreateOffice: true,
  showDatatables: true,
  showChartofAccounts: true,
  showCharges: true,
  showManageFunds: true,
};
const mockDocumentationLinks = { open: jest.fn() };

/* The shell's children each pull in the whole application dependency tree.
   Stubbing them keeps the real component logic while leaving the real
   dependency tree out of the way — matching the pattern from
   shell.component.spec.ts. */

@Component({ selector: 'mifosx-sidenav', template: '' })
class StubSidenavComponent {
  @Input() sidenavCollapsed = true;
}

@Component({ selector: 'mifosx-toolbar', template: '' })
class StubToolbarComponent {
  @Input() sidenav: any;
  @Output() collapse = new EventEmitter<boolean>();
}

describe('Logout confirmation gate — toolbar and sidenav', () => {
  let toolbarFixture: ComponentFixture<ToolbarComponent>;
  let toolbarComponent: ToolbarComponent;
  let sidenavFixture: ComponentFixture<SidenavComponent>;
  let sidenavComponent: SidenavComponent;

  const mockDialogOpen = jest
    .fn()
    .mockReturnValue({ afterClosed: jest.fn().mockReturnValue(of(true)) });

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TranslateModule.forRoot()],
      providers: [
        { provide: MatDialog, useValue: { open: mockDialogOpen } },
        { provide: provideRouter, useValue: [] },
        { provide: provideAnimationsAsync },
        { provide: BreakpointObserver, useValue: mockBreakpointObserver },
        { provide: Router, useValue: mockRouter },
        { provide: AuthenticationService, useValue: mockAuthenticationService },
        { provide: PopoverService, useValue: mockPopoverService },
        { provide: ConfigurationWizardService, useValue: mockConfigurationWizardService },
        { provide: DocumentationLinksService, useValue: mockDocumentationLinks },
        { provide: ChangeDetectorRef },
        { provide: DestroyRef },
      ],
    })
      .overrideComponent(ToolbarComponent, {
        remove: { imports: [SidenavComponent] },
        add: { imports: [StubSidenavComponent] },
      })
      .overrideComponent(SidenavComponent, {
        remove: { imports: [ToolbarComponent] },
        add: { imports: [StubToolbarComponent] },
      })
      .compileComponents();
  });

  beforeEach(() => {
    toolbarFixture = TestBed.createComponent(ToolbarComponent);
    toolbarComponent = toolbarFixture.componentInstance;
    toolbarFixture.detectChanges();

    sidenavFixture = TestBed.createComponent(SidenavComponent);
    sidenavComponent = sidenavFixture.componentInstance;
    sidenavFixture.detectChanges();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('ToolbarComponent', () => {
    it('opens the confirmation dialog on confirmLogout and calls logout when confirmed', () => {
      toolbarComponent.confirmLogout();
      expect(mockDialogOpen).toHaveBeenCalledWith(ToolbarComponent);
      expect(mockDialogOpen).toHaveBeenCalledTimes(1);
      // afterClosed resolves with true → logout is called once
      expect(toolbarComponent.logout).toHaveBeenCalledTimes(1);
    });

    it('stays logged in when the dialog is confirmed false', () => {
      (mockDialogOpen as jest.Mock).mockReturnValueOnce({
        afterClosed: jest.fn().mockReturnValue(of(false)),
      });
      toolbarComponent.confirmLogout();
      expect(toolbarComponent.logout).not.toHaveBeenCalled();
    });

    it('stays logged in when the dialog is dismissed (undefined)', () => {
      (mockDialogOpen as jest.Mock).mockReturnValueOnce({
        afterClosed: jest.fn().mockReturnValue(of(undefined)),
      });
      toolbarComponent.confirmLogout();
      expect(toolbarComponent.logout).not.toHaveBeenCalled();
    });
  });

  describe('SidenavComponent', () => {
    it('opens the confirmation dialog on logout click and calls logout when confirmed', () => {
      sidenavComponent.logout();
      expect(mockDialogOpen).toHaveBeenCalledWith(SidenavComponent);
      expect(mockDialogOpen).toHaveBeenCalledTimes(1);
      expect(sidenavComponent.logout).toHaveBeenCalledTimes(1);
    });

    it('stays logged in when the dialog is confirmed false', () => {
      (mockDialogOpen as jest.Mock).mockReturnValueOnce({
        afterClosed: jest.fn().mockReturnValue(of(false)),
      });
      sidenavComponent.logout();
      expect(sidenavComponent.logout).not.toHaveBeenCalled();
    });

    it('stays logged in when the dialog is dismissed (undefined)', () => {
      (mockDialogOpen as jest.Mock).mockReturnValueOnce({
        afterClosed: jest.fn().mockReturnValue(of(undefined)),
      });
      sidenavComponent.logout();
      expect(sidenavComponent.logout).not.toHaveBeenCalled();
    });
  });
