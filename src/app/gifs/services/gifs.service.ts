
import { HttpClient, HttpErrorResponse, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { catchError, map, throwError, timeout } from 'rxjs';
import { Gif, SearchResponse, } from './../interfaces/gifs.interfaces';

@Injectable({
  providedIn: 'root'
})
export class GifsService {

  public gifList: Gif[] = [];
  private _tagsHistory: string[]  = [];
  private apiKey:       string    = 'nwUD1VdEShA0t4uqSUB3dtnz6dlBBFku';
  private searchUrl:    string    = 'https://api.giphy.com/v1/gifs';

  constructor(
    private http: HttpClient,
  ) { 
    this.loadSessionStorage();
  }

  get tagsHistory(){
    return [ ...this._tagsHistory ];
  }

  
  private organizeHistory( tag: string ){
    tag = tag.toLowerCase();

    if( this._tagsHistory.includes( tag ) )
      this._tagsHistory = this._tagsHistory.filter( (oldTag) => oldTag !== tag );

    this._tagsHistory.unshift( tag );
    this._tagsHistory = this._tagsHistory.splice( 0, 10 );
    this.saveSessionStorage();
  }

  searchTag( tag: string ): void{
    if(!tag) return;
    this.organizeHistory( tag );

    const params = new HttpParams()
    .set('api_key', this.apiKey)
    .set('limit', '10')
    .set('q', tag)

    this.http.get<SearchResponse>(`${ this.searchUrl }/search`, { params })
    .pipe(
      map(resp =>{
        if(resp.meta.status !== 200) throw new Error("Error to get gifs");
        return resp.data;
      }),
      catchError(( error: HttpErrorResponse )=>{
        return throwError( () => error );
      }),
      timeout(500)
    )
    .subscribe( gifList => {
      this.gifList = gifList;
    })

  }

  private saveSessionStorage(): void {
    sessionStorage.setItem('history', JSON.stringify(this._tagsHistory))
  }

  private loadSessionStorage(): void {
    const history = sessionStorage.getItem ('history');
    if(!history) return;
    this._tagsHistory = JSON.parse(history);

    if(this._tagsHistory.length === 0) return;

    this.searchTag(this._tagsHistory[0])
  }

}
