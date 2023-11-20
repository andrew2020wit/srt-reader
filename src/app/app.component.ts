import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  OnInit,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { localStorageKeysEnum } from './models/local-storage-keys.enum';
import { ISrtDataItem } from './models/srt-data-item.interface';

@Component({
  selector: 'app-root',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, MatButtonModule],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
})
export class AppComponent implements OnInit {
  protected srtDataForView: ISrtDataItem[] = [];
  protected selectedId = '';

  private srtData: ISrtDataItem[][] = [[], []];

  constructor(private cd: ChangeDetectorRef) {}

  public ngOnInit(): void {
    this.restoreState();
  }

  protected selectItem(item: ISrtDataItem): void {
    this.selectedId = item.id;
    this.saveState();
  }

  protected goHome(): void {
    window.open('https://github.com/andrew2020wit/srt-reader', '_blank');
  }

  protected clear(): void {
    this.srtData = [[], []];
    this.selectedId = '';
    this.computeSrtDataForView();

    localStorage.setItem(localStorageKeysEnum.selectedId, '');
    localStorage.setItem(localStorageKeysEnum.srtData, '');
  }

  protected getFormadedTime(timeFromSeconds: number): string {
    const h = Math.floor(timeFromSeconds / 3600);
    const m = Math.floor((timeFromSeconds - h * 3600) / 60);
    const s = timeFromSeconds - h * 3600 - m * 60;

    const hh = h > 9 ? '' + h : h > 0 ? '0' + h : '00';
    const mm = m > 9 ? '' + m : m > 0 ? '0' + m : '00';
    const ss = s > 9 ? '' + s : s > 0 ? '0' + s : '00';

    return `${hh}:${mm}:${ss}`;
  }

  protected openFile(event: Event, subtitleIndex: number): void {
    const target = event.target as HTMLInputElement;
    const file = target?.files?.[0];

    if (!file) {
      return;
    }

    const reader = new FileReader();

    reader.onload = (e: any) => {
      this.computeSrtData(e.target.result, subtitleIndex);
    };

    reader.readAsText(file);
  }

  private computeSrtData(textFile: string, subtitleIndex: number): void {
    this.srtData[subtitleIndex] = [];
    let id: ISrtDataItem['id'] = '';
    let text: ISrtDataItem['text'] = '';
    let timeFromSeconds: ISrtDataItem['timeFromSeconds'] = 0;
    let index = 0;

    const arr = textFile.split('\n').map((x) => x.trim());

    for (let i = 0; i < arr.length; i++) {
      const item = arr[i];

      if (!item) {
        index = 0;

        if (!isNaN(timeFromSeconds)) {
          this.srtData[subtitleIndex].push({
            id,
            text,
            timeFromSeconds: timeFromSeconds,
            subtitleIndex,
          });
        }

        text = '';
        continue;
      }

      if (index === 0) {
        id = 'id-' + subtitleIndex + '-' + item;
      }

      if (index === 1) {
        timeFromSeconds = this.getTimeFrom(item);
      }

      if (index > 1) {
        text = text + ' ' + item;
      }

      index++;
    }

    this.computeSrtDataForView();
  }

  private computeSrtDataForView(): void {
    this.srtDataForView = [...this.srtData[0], ...this.srtData[1]];

    this.srtDataForView.sort((a, b) => a.timeFromSeconds - b.timeFromSeconds);

    this.cd.detectChanges();
  }

  private getTimeFrom(strTime: string): number {
    const arr = strTime
      .slice(0, 8)
      .split(':')
      .map((x) => +x);

    return arr[0] * 3600 + arr[1] * 60 + arr[2];
  }

  private saveState(): void {
    localStorage.setItem(localStorageKeysEnum.selectedId, this.selectedId);
    localStorage.setItem(
      localStorageKeysEnum.srtData,
      JSON.stringify(this.srtData)
    );
  }

  private restoreState(): void {
    const srtDateStr = localStorage.getItem(localStorageKeysEnum.srtData);

    if (!srtDateStr) {
      return;
    }

    this.selectedId =
      localStorage.getItem(localStorageKeysEnum.selectedId) || '';

    const srtData = JSON.parse(srtDateStr);

    this.srtData[0] = srtData?.[0] || [];
    this.srtData[1] = srtData?.[1] || [];

    this.computeSrtDataForView();

    if (this.selectedId) {
      setTimeout(() => {
        window.document.querySelector('#' + this.selectedId)?.scrollIntoView();
      }, 200);
    }
  }
}
