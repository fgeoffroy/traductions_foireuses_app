import { Component, OnInit } from '@angular/core';
import { LocalDbService } from '../services/local-db.service';
import { Router } from '@angular/router';
import { Animation, AnimationController } from '@ionic/angular';



@Component({
  selector: 'app-game',
  templateUrl: './game.page.html',
  styleUrls: ['./game.page.scss'],
})
export class GamePage implements OnInit {

  public currentQuestionNb = 0;
  public score = 0;
  public nbRightAnswer = 0;
  public nbQuestionQuiz: number;
  public nbOptions: number;   //Attention dans le html, la grille des réponses n'est pas créée de maniere responsive
  public nbSentences = 4;   //Attention dans le html, la grille des phrases n'est pas créée de maniere responsive
  public nbClues = 0;
  public isAnswered = false;
  public tagName: string;
  private questionIndices: any;
  private alreadyChosen = [];
  private buttonColor = "purpleC";
  private buttonColorSuccess = "success";  //"paleGreenC"
  private buttonColorFailure = "danger";    //"paleRedC"
  private colorButtons = Array(this.nbOptions).fill(this.buttonColor);
  public question = new Question(this.nbSentences);
  public progressBar = Array(10).fill("greyC");
  public animations: any[] = [];


  constructor(
    private localDb: LocalDbService,
    private router: Router,
    private animationCtrl: AnimationController) {}


  ngOnInit() {
    this.tagName = this.localDb.tagName;
    this.questionIndices = this.localDb.get_tag_indices();
    this.create_animations();
    this.nbQuestionQuiz = this.localDb.nbQuestionQuiz;
    this.nbOptions = this.localDb.nbOptions;
    this.currentQuestionNb = 0;
    this.get_question();
    // this.localDb.set_nbQuestionQuiz(this.nbQuestionQuiz.toString()).then(() => {   //wait for set
    //   this.get_question();
    // });
  }




  private create_animations() {
    let duration = 200;
    let blurredShadow = '0 0 9px rgba(0,0,0,0.5)';
    let unblurredShadow = '0 0 0px rgba(0,0,0,0.5)';
    let blurredColor = 'transparent';
    let unblurredColor = 'inherit';

    for (let i=1; i<this.nbSentences; i++){
      let id = 'lyrics_' + i.toString();
      this.animations.push(this.animationCtrl.create()
        .addElement(document.getElementById(id))
        .duration(duration)
        .iterations(1)
        .keyframes([
          { offset: 0, textShadow: blurredShadow, color: blurredColor },
          { offset: 1, textShadow: unblurredShadow, color: unblurredColor },
        ]));
      }
  }





  private get_question() {
    this.currentQuestionNb++;
    this.progressBar[this.currentQuestionNb - 1] = "purpleC";
    this.nbClues = 0;
    this.question = new Question(this.nbSentences);
    let chosenAnswers = [];
    while (chosenAnswers.length < this.nbOptions) {
        // let randInt = Math.floor(Math.random() * this.totalNbQuestions) + 1;
        let randInt = this.questionIndices[Math.floor(Math.random() * this.questionIndices.length)];
        if (chosenAnswers.indexOf(randInt) == -1 && this.alreadyChosen.indexOf(randInt) == -1)
        {
          chosenAnswers.push(randInt);
          this.alreadyChosen.push(randInt);
        }
    }
    let rightInd = Math.floor(Math.random() * this.nbOptions);
    this.question.answerInd = rightInd;
    let id = chosenAnswers[rightInd];
    this.localDb.get_lyrics(id.toString()).then(res => {   //wait for get
      this.question.lyrics = res;
      this.question.sentences[0] = res[0];
      for (let i=1; i<this.question.lyrics.length; i++){
        this.question.sentences[i] = this.randomize_sentence(this.question.lyrics[i]);
        this.animations[i-1].stop();
        document.getElementById("lyrics_" + i.toString()).style.color = 'transparent';
        document.getElementById("lyrics_" + i.toString()).style.textShadow = '0 0 9px rgba(0,0,0,0.5)';
      }

    });
    for (const ind of chosenAnswers) {
      this.localDb.get_title(ind.toString()).then(res => {   //wait for get
        this.question.answers.push(res);
      });
    }
  }




  public randomize_sentence(sentence: string) {
    let result = '';
    let characters = 'abcdefghijklmnopqrstuvwxyz';
    let charactersLength = characters.length;
    for ( let i = 0; i < sentence.length; i++ ) {
      if (sentence[i] == " ") {
        result += " ";
      } else {
        result += characters.charAt(Math.floor(Math.random() * charactersLength));
      }
    }
    return result;
  }





  public next_sentence() {
    this.nbClues++;
    this.question.sentences[this.nbClues] = this.question.lyrics[this.nbClues];
    // document.getElementById("lyrics_" + this.nbClues.toString()).style.color = '#8c8c8c';
    // document.getElementById("lyrics_" + this.nbClues.toString()).style.textShadow = '0 0 0px';
    this.animations[this.nbClues-1].play();
  }





  public send_answer(i: number) {
    if (!this.isAnswered) {
      this.isAnswered = true;
      if (i == this.question.answerInd) {
        this.score += 10 - 1 * this.nbClues;
        this.nbRightAnswer++;
        this.colorButtons[i] = this.buttonColorSuccess;
      } else {
        this.colorButtons[i] = this.buttonColorFailure;
        this.colorButtons[this.question.answerInd] = this.buttonColorSuccess;
      }
    }

    this.question.sentences = this.question.lyrics;
    for(let i=this.nbClues; i<this.question.lyrics.length-1; i++){
      this.animations[i].play();
    }
    // for(let i=1; i<this.question.lyrics.length; i++){
    //   document.getElementById("lyrics_" + i.toString()).style.color = '#8c8c8c';
    //   document.getElementById("lyrics_" + i.toString()).style.textShadow = '0 0 0px';
    // }
  }


  public next_question() {
    if (this.currentQuestionNb == this.nbQuestionQuiz) {
      this.localDb.score = this.score;
      this.localDb.nbRightAnswer = this.nbRightAnswer;
      for (let i=0; i<this.question.lyrics.length-1; i++){
        this.animations[i].stop();
      }
      this.router.navigate(['/score']);
    } else {
      this.isAnswered = false;
      this.colorButtons = Array(this.nbOptions).fill(this.buttonColor);
      this.get_question();
    }
  }




  public getColor(i: number) {
    // return "'danger'";
    return this.colorButtons[i];
  }




  public get_relative_score() {
    return this.score * 100 / 100;
  }



}






export class Question {
  lyrics: string[];
  answers: string[];
  answerInd: number;
  sentences: string[];

  constructor(nbSentences: number) {
    this.lyrics = [];
    this.answers = new Array<string>();
    this.answerInd = 0;
    this.sentences = Array(nbSentences).fill("");
  }
}
