import { Injectable } from '@angular/core';
import { LoadingController } from '@ionic/angular';

@Injectable({
  providedIn: 'root'
})
export class LoaderService {
  private loaderHandel: any;
  constructor(public loadingController: LoadingController) { }

  public create(msg: string): void {
      this.loadingController.create({
        message: msg
      }).then(overlay => {
        this.loaderHandel = overlay;
        this.loaderHandel.present();
      });
  }
  public present(): void {
   
  }
  public dismiss(): void {
      this.loaderHandel.dismiss();
  }
}
