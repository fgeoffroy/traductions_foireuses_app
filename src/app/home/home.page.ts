import { Component, OnInit } from '@angular/core';
import { LocalDbService } from '../services/local-db.service';
import { Router } from '@angular/router';
import { LoadingController, Animation, AnimationController } from '@ionic/angular';
import { Observable } from 'rxjs';



@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
})
export class HomePage {

  public loadingMsg = "";
  public playableTags: any;
  public nbQuestionQuiz = 10;
  public nbOptions = 4;
  public segmentModel: string;
  public loader;
  public dbName = "Not created yet";
  public showPage = false;
  public disableButtons = true;
  public animations: any[] = [];
  public animationTime = 1000;   // 1000
  public pauseTime = 1000;       // 1000
  private t0: number;


    /*
    enregistrer la version en local EN DERNIER (apres toutes les chansons)
    trouver un moyen pour etre sur que la local db est à jour avec plsu que la version :
      genre je mets version et nombre de fichiers et vérifier si j'ai bien le bon nombre de fichiers
        ATTENTION A NE PAS REGARDER L'HISTORIQUE DES SCORE ET LE ARRAY DES INDICES

    Il faut que je stocke :
      - le nombre de questions
      - le nombre de scores
      - le nombre d'array indices

    ecran d'acceuil pendant que ça charge
    commentaire score
    changer couleur palette
    historique score

    + logo
    */






  constructor(
    private localDb: LocalDbService,
    private router: Router,
    private loadingController: LoadingController,
    private animationCtrl: AnimationController) {
    this.segmentModel = "english";
  }


  ngOnInit() {
    // this.segmentModel = "english";

    this.animate_logo();

    // Test if DB is up to date
    this.localDb.getDatabaseState().subscribe(rdy => {
      if (rdy) {
        this.check_start();
      }
    });


    // Listent if app get access to Internet
    window.addEventListener('online', () => {
      if (this.disableButtons) {
        setTimeout(() => {
          this.dismiss_loading_connection();
          location.reload();
          // this.check_start();
          // this.ngOnInit();
        }, 2000);
      }
    });


  }




  public animate_logo() {
    this.animations.push(this.animationCtrl.create()
      .addElement(document.getElementById('logo_div'))
      .duration(this.animationTime)
      .iterations(1)
      .keyframes([
        { offset: 0, opacity: 0 },
        { offset: 1, opacity: 1 },
      ]));

      this.t0 = performance.now();
      this.animations[0].play();

      this.animations.push(this.animationCtrl.create()
        .addElement(document.getElementById('logo_div'))
        .duration(this.animationTime / 2)
        .iterations(1)
        .keyframes([
          { offset: 0, opacity: 1 },
          { offset: 1, opacity: 0 },
        ]));

      this.animations.push(this.animationCtrl.create()
        .addElement(document.getElementsByClassName('ion-page')[0])
        .duration(this.animationTime / 2)
        .iterations(1)
        .keyframes([
          { offset: 0, opacity: 0 },
          { offset: 1, opacity: 1 },
        ]));

  }




  public check_start() {
    this.localDb.update_db().then((res) => {
      this.loadingMsg = res[1].toString();
      this.localDb.is_storage_ready().then((isReady) => {
        let waiting = this.animationTime + this.pauseTime;
        let t1 = performance.now();
        if (t1 - this.t0 >= waiting) {
          waiting = 0;
        } else {
          waiting -= t1 - this.t0;
        }
        setTimeout(() => {
          this.animations[0].stop();
          if (res[0]) {
            this.animations[1].play();
            setTimeout(() => {
              this.animations[1].stop();
              document.getElementById('logo_div').style.visibility = 'hidden';
              this.animations[2].play();
              this.showPage = true;
              this.disableButtons = false;
              this.dbName = this.localDb.dbName;
              this.playableTags = this.localDb.get_playable_tags(this.nbQuestionQuiz, this.nbOptions);
            }, this.animationTime / 2);
          } else {
            document.getElementById('logo_div').style.visibility = 'hidden';
            this.loading_connection();
          }
        }, waiting);
      });
    });
  }





  public async loading_connection() {
    let msg = "";
    if (this.loadingMsg == "error_connect_db") {
      msg = '<p>Problème de connexion. Impossible de se connecter à la base de données.</p><p>Veuillez réessayer.</p>';
    } else {
      msg = '<p>Veuillez vous connecter à Internet pour télécharger les questions.</p><p>Par la suite vous pourrez jouer hors ligne.</p>';
    }
    this.loader = await this.loadingController.create({
      spinner: "lines",
      cssClass: 'ion-loading-class',
      // message: 'Veuillez vous connecter à Internet\npour télécharger les questions',
      message: msg,
      // duration: 3000,
    });
    await this.loader.present();
    const { role, data } = await this.loader.onDidDismiss();
  }



  public async dismiss_loading_connection(){
    this.loader = await this.loadingController.dismiss();
  }




  public get_tags(type: string, lang: string) {
    return this.playableTags.filter(x => x.lang == lang && x.type == type && x.name != 'english' && x.name != 'french');
  }


  public start(tagName: string) {
    this.localDb.tagName = tagName;
    this.animations[2].stop();
    this.router.navigate(['/game']);
  }




}
