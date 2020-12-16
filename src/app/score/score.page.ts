import { Component, OnInit } from '@angular/core';
import { LocalDbService } from '../services/local-db.service';

@Component({
  selector: 'app-score',
  templateUrl: './score.page.html',
  styleUrls: ['./score.page.scss'],
})
export class ScorePage implements OnInit {

  public score = 0;
  public nbRightAnswer = 0;
  public nbQuestionQuiz = 0;

  constructor(private localDb: LocalDbService) {}

  ngOnInit() {
    // this.localDb.get_score().then(res => {   //wait for get
    this.score = this.localDb.score;
    this.nbRightAnswer = this.localDb.nbRightAnswer;
    this.nbQuestionQuiz = this.localDb.nbQuestionQuiz;
    // this.localDb.get_nbQuestionQuiz().then(res => {   //wait for get
    //   this.nbQuestionQuiz = res;
    // });
    // });
  }

  public get_relative_score() {
    return this.score * 100 / 100;
  }

}
