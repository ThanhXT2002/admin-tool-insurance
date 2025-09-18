import { Component, effect, inject, signal, ViewChild } from '@angular/core';
import {
    FormBuilder,
    FormGroup,
    ReactiveFormsModule,
    Validators
} from '@angular/forms';
import { FloatLabelModule } from 'primeng/floatlabel';
import { InputTextModule } from 'primeng/inputtext';
import { TextareaModule } from 'primeng/textarea';
import { Select } from 'primeng/select';
import { ToggleSwitchModule } from 'primeng/toggleswitch';
import { ButtonModule } from 'primeng/button';
import { Seo } from '../../components/seo/seo';
import { ActivatedRoute, Router } from '@angular/router';
import { LoadingService } from '@/layout/service/loading.service';
import { CommonModule } from '@angular/common';
import { MessageService } from 'primeng/api';

@Component({
    selector: 'app-post-form',
    imports: [
        ReactiveFormsModule,
        InputTextModule,
        FloatLabelModule,
        TextareaModule,
        Select,
        ToggleSwitchModule,
        ButtonModule,
        Seo,
        CommonModule
    ],
    templateUrl: './post-form.html',
    styleUrl: './post-form.scss'
})
export class PostForm {
    private fb = inject(FormBuilder);
    private loadingService = inject(LoadingService);
    private messageService = inject(MessageService);

    headerTitle!: string;
}
