import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, Router } from '@angular/router';

@Component({
  selector: 'app-signup',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './signup.component.html',
})
export class CustomSignupComponent implements OnInit {
  public user: any = {};
  public submitted = false;
  public errors: string[] = [];

  constructor(protected router: Router) {}

  public ngOnInit(): void {}

  public signup() {
    this.errors = [];
    this.submitted = true;
    console.log('Signup logic skipped to be implemented.');
    this.submitted = false;
  }
}
