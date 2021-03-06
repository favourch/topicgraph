import { Component, ViewChild, OnDestroy } from '@angular/core';
import { PdfAnalyzerService } from '../../services/pdf-analyzer.service';
import { Router } from '@angular/router';

@Component({
    selector: 'pdf-submit',
    templateUrl: 'pdf-submitter.component.html',
    styleUrls: ['pdf-submitter.component.css']
})
export class PdfSubmitterComponent implements OnDestroy {
    fileIsOverDropZone: boolean = false;
    @ViewChild('submitModal') submitModal: any;
    dataUrl: any;
    submitSub: any;
    status = 'INITIAL';

    constructor(public router: Router,
                private pdfAnalyzerService: PdfAnalyzerService) {}

    fileToPromise(f: File) {
        let binaryReaderDefer = new Promise<any>((resolve, reject) => {
            let binaryReader = new FileReader();
            binaryReader.onloadend = function (e: ProgressEvent) {
                let fileReader: FileReader = <FileReader>e.target;
                resolve(fileReader.result);
            };
            binaryReader.readAsDataURL(f);
        });
        return binaryReaderDefer;
    }

    public fileDrop(event: any) {
        event.preventDefault();
        let dataTransfer = event.dataTransfer;
        if (dataTransfer.files.length > 0) {
            for (let i = 0; i < event.dataTransfer.files.length; i++) {
                let file: File = event.dataTransfer.files[i];
                let type: string = event.dataTransfer.files[i].type;
                if (type === 'application/pdf') {
                    this.fileToPromise(file).then((dataUrl: string) => {
                        this.dataUrl = dataUrl;
                        this.submitModal.show();
                    });
                } else {
                    console.log('Unsupported file:', file);
                }
            }
        } else {
            let text: string = dataTransfer.getData('text') || decodeURI(dataTransfer.getData('text/uri-list'));
            let types = dataTransfer.types;
            if ((text.slice(0, 7) === 'http://' || text.slice(0,7) === 'https://') && text.toLowerCase().indexOf('.pdf') > 0) {
                console.log(text);
            } else {
                console.log('fileDrop: text="' + text + '" types=' + types);
            }
        }
    }

    public fileOverBase(isOver: boolean): void {
        if (isOver !== this.fileIsOverDropZone) this.fileIsOverDropZone = isOver;
    }

    public doSubmit(notificationEmail: any) {
        this.submitModal.hide();
        this.status = 'UPLOADING';
        this.submitSub = this.pdfAnalyzerService
            .submit(this.dataUrl, notificationEmail)
            .catch(error => this.status = 'FAILURE')
            .subscribe(resp => {
                this.status = 'SUCCESS';
                // this.submitModal.hide();
                // this.router.navigate(['/']);
            });
    }

      public restart(event:any) {
        this.status = 'INITIAL';
    }
    
    fileSelected(event: any) {
        if (event.target.files.length > 0 && event.target.files[0].type === 'application/pdf') {
            this.fileToPromise(event.target.files[0]).then((dataUrl: string) => {
                this.dataUrl = dataUrl;
                this.submitModal.show();
            });
        }
    }

    ngOnDestroy() {
        if (this.submitSub) this.submitSub.unsubscribe();
    }
}
