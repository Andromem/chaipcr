import {
  Component,
  ElementRef,
  OnChanges,
  OnDestroy,
  Input,
} from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';
import ngStyles from 'ng-style'
import { Router } from '@angular/router';
import { Experiment } from '../../models/experiment.model';
import { ExperimentService } from '../../services/experiment/experiment.service';
import { StatusService } from '../../../services/status/status.service';
import { StatusData } from '../../models/status.model';

import 'rxjs/add/operator/takeUntil';
import { Subject } from 'rxjs/Subject';

@Component({
  selector: '[chai-header-status]',
  templateUrl: './header-status.component.html',
  styleUrls: ['./header-status.component.scss']
})

export class HeaderStatusComponent implements OnChanges, OnDestroy {

  public experiment: Experiment;
  public state: string;
  public statusData: StatusData;
  public analyzed = false;
  public remainingTime: number;
  public background: string;
  private ngUnsubscribe: Subject<void> = new Subject<void>(); // = new Subject(); in Typescript 2.2-2.4

  constructor(private el: ElementRef, private expService: ExperimentService, private statusService: StatusService, private router: Router, private sanitizer: DomSanitizer) {
    statusService.$data
      .takeUntil(this.ngUnsubscribe)
      .subscribe((statusData: StatusData) => {
        this.extraceStatusData(statusData);
      })

    let p = 50
    this.background = `linear-gradient(left,  #64b027 0%,#c6e35f ${p || 0}%,#5d8329 ${p || 0}%,#5d8329 100%)`
  }

  @Input('experiment-id') expId: number;

  ngOnChanges() {
    if (this.expId) {
      this.expService.getExperiment(+this.expId).subscribe((exp: Experiment) => {
        this.experiment = exp;
      })
    }
  }
  //https://stackoverflow.com/questions/38008334/angular-rxjs-when-should-i-unsubscribe-from-subscription
  ngOnDestroy() {
    this.ngUnsubscribe.next();
    this.ngUnsubscribe.complete();
  }

  public startExperiment() {
    this.expService.startExperiment(+this.expId).subscribe(() => {
      this.router.navigate(['/charts', 'exp', +this.expId, 'amplification'])
    })
  }

  public isCurrentExperiment(): boolean {
    if (this.statusData && this.expId) {
      return this.statusData.experiment_controller.experiment.id === +this.expId;
    } else {
      return false;
    }
  }

  private extraceStatusData (d: StatusData) {
    this.statusData = d;
    this.state = d.experiment_controller.machine.state;
    this.remainingTime = this.statusService.timeRemaining();
    if(this.state === 'running' && this.isCurrentExperiment()) {
      let p = this.statusService.timePercentage() * 100
      //this.background = `-webkit-linear-gradient(left,  #64b027 0%,#c6e35f #{p || 0}%,#5d8329 #{p || 0}%,#5d8329 100%)`
      this.expService.$updates.subscribe((evt) => {
        if(evt === 'experiment:completed') {
          this.analyzed = true;
        }
      });
    }
  }

  public stringify (obj) {return JSON.stringify(obj) }

  public getStyles () {
    let s = {
      background: this.background,
      color: 'red'
    }
    let p = ngStyles(s)
    console.log(p)
    //console.log(p)
    return this.sanitizer.bypassSecurityTrustStyle(p)

  }

}