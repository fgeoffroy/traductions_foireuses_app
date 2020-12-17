import { Injectable } from '@angular/core';
import { AngularFirestore, AngularFirestoreDocument } from '@angular/fire/firestore';
import { Storage } from '@ionic/storage';
import { HttpClient } from '@angular/common/http';
// import papa from 'papaparse';
import { SQLite, SQLiteObject } from '@ionic-native/sqlite/ngx';
import { Platform } from '@ionic/angular';
import { BehaviorSubject, Observable } from 'rxjs';





@Injectable({
  providedIn: 'root'
})
export class LocalDbService {

  private useSQLite = true;   //If true, we use SQLite (not working on web browsers), if false, we use Storage (works on every platform, but MUCH LESS performant on android)
  private database: SQLiteObject;
  private dbReady: BehaviorSubject<boolean> = new BehaviorSubject(false);
  public msg = "";
  public tagName = "";
  private dbVersion = 0;
  public tags: Tag[] = [];
  public dbName = "Not created yet";
  public nbQuestionQuiz: number;
  public nbOptions: number;
  public score = 0;
  public nbRightAnswer = 0;
  private songs = [];

// , private firestore: AngularFirestore
  constructor(
    private storage: Storage,
    private firestore: AngularFirestore,
    private http: HttpClient,
    private sqlite: SQLite,
    private plt: Platform
  ) {
    if (this.useSQLite) {
      this.plt.ready().then(() => {
        this.sqlite.create({
          name: 'data.db',
          location: 'default'
        })
          .then((db: SQLiteObject) => {
            this.database = db;
            this.database.executeSql(
              'create table if not exists Songs(id INT(4), artist VARCHAR(100), title VARCHAR(100), trans_lyrics_1 VARCHAR(250), trans_lyrics_2 VARCHAR(250), trans_lyrics_3 VARCHAR(250), trans_lyrics_4 VARCHAR(250))', [])
              // .then(() => console.log('Executed SQL'))
              // .catch(e => console.log(e));
            this.database.executeSql(
              'create table if not exists Tags(type VARCHAR(30), lang VARCHAR(10), name VARCHAR(50), indices VARCHAR(1000))', [])
              // .then(() => console.log('Executed SQL'))
              // .catch(e => console.log(e));
            this.database.executeSql(
              'create table if not exists MetaInfo(name VARCHAR(30), number INT(6))', [])
              // .then(() => console.log('Executed SQL'))
              // .catch(e => console.log(e));
            this.dbReady.next(true);
          })
          // .catch(e => console.log(e));
      });
    }
  }




  public getDatabaseState() {
    return this.dbReady.asObservable();
  }








  public update_db() {
    if (navigator.onLine) {
    // if (false) {
      return this.get_firestore_version().then((firestoreVersion) => {   //wait for firestore
        if (firestoreVersion != "error") {
          return this.get_local_db_version().then((localVersion) => {   //wait for storage
            if (localVersion != firestoreVersion) {
            // if (true) {   // XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
              // console.log("Local DB needs to be updated");
              this.dbVersion = firestoreVersion;
              return this.delete_local_db().then(() => {   //wait for storage
                return this.initialize_db().then(() => {
                  return this.fill_db().then((fill) => {
                    // console.log("FILLED", fill);
                    return this.save_indices().then((indices) => {
                      // console.log("INDICES", indices);
                      return [true, "Mise à jour"];
                    });
                  });
                });
              });
            } else {
              // console.log("Local DB is up to date");
              return this.retrieve_indices().then(() => {   //wait for storage
                return [true, "Local DB is up to date"];
              });
            }
          });
        } else {
          return this.no_connect("online").then((msg) => {   //wait for storage
            return msg;
          });
        }
      });
    } else {
      return this.no_connect("offline").then((msg) => {   //wait for storage
        return msg;
      });
    }
  }



  public no_connect(connectionStatus: string) {
    return this.get_local_db_version().then((localVersion) => {   //wait for storage
      if (localVersion > 0) {
      // if (false) {    //XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
        // console.log("No connection, but local DB exists");
        return this.retrieve_indices().then(() => {   //wait for storage
          return [true, "No connection, but local DB exists"];
        });
      } else {
        if (connectionStatus == "online") {
          return [false, "error_connect_db"];
        } else {
          return [false, "no_connection_no_local_db"];
        }
      }
    });
  }




  public get_firestore_version() {
    // let url = 'https://deductive-milestone.000webhostapp.com/retrieve-version.php';
    // return this.http.get(url)
    //   .toPromise()
    //   // CATCH ERROR XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
    //   .then((res) => {
    //     return res[0].version;
    //   });
    return this.firestore
      .collection("songs_collec")
      .doc("meta_info_doc")
      .get()
      .toPromise()
      // .catch((error: firebase.FirebaseError) => {
      //   console.log('XXXXXXXXXXXX', error.code)
      //   return error.code;
      // })
      .then(
        doc => {
          return doc.data()['meta_info']['version']['number'];
        }
      // );
    )
    .catch((error) => {
      // console.log(error)
      return "error";
    });
  }




  public get_local_db_version() {
    if (this.useSQLite) {
      // Test if all songs and all tags are present in the database
      return this.database.executeSql("SELECT * FROM MetaInfo", []).then((dataMeta) => {
        return this.database.executeSql("SELECT COUNT(*) FROM Tags", []).then((countTags) => {
          return this.database.executeSql("SELECT COUNT(*) FROM Songs", []).then((countSongs) => {
            if (dataMeta.rows.length == 3 && countTags.rows.length > 0 && countSongs.rows.length > 0) {
              let version = dataMeta.rows.item(0).number;
              let nbTags = dataMeta.rows.item(1).number;
              let nbSongs = dataMeta.rows.item(2).number;
              if (countTags.rows.item(0)['COUNT(*)'] == nbTags && countSongs.rows.item(0)['COUNT(*)'] == nbSongs) {
                return version;
              } else {
                return 0;
              }
            } else {
              return 0;
            }
          });
        });
      });
    } else {
      return this.storage.get('version').then((res) => {
        return Number(res);     // Return 0 res is null
    });
    }
  }






  public initialize_db() {
    if (this.useSQLite) {
      this.dbName = "Cordova SQLite";
      let data = ["version", this.dbVersion];
      return this.database.executeSql("INSERT INTO MetaInfo (name, number) VALUES (?, ?)", data).then(() => {
      });
    } else {
      return this.storage.ready().then(() => {
        this.dbName = this.storage.driver;
        this.storage.set('version', this.dbVersion.toString());
      });
    }
  }









  public fill_db() {
    // let url = 'https://deductive-milestone.000webhostapp.com/retrieve-songs.php';
    // return this.http.get<any[]>(url)
    //   .toPromise()
    //   // CATCH ERROR XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
    //   .then(
    //     res => {
    //       this.tags.push({
    //         type: 'genre',
    //         name: 'english',
    //         lang: 'en',
    //         indices: [],
    //       });
    //       this.tags.push({
    //         type: 'genre',
    //         name: 'french',
    //         lang: 'fr',
    //         indices: [],
    //       });
    //       res.forEach((song, id) => {
    //         id++;
    //         // console.log(id,song);
    //         // Language
    //         if (song.tag_type == "genre") {
    //           if (song.src_lang == "fr") {
    //             this.tags.find(x => x.name == "french").indices.push(id);
    //           } else {
    //             this.tags.find(x => x.name == "english").indices.push(id);
    //           }
    //         }
    //
    //         // Genre and artists tags
    //         if (!this.tags.find(x => x.name == song.tag_name)) {
    //           this.tags.push({
    //             type: song.tag_type,
    //             name: song.tag_name,
    //             lang: song.tag_lang,
    //             indices: [],
    //           });
    //         }
    //         this.tags.find(x => x.name == song.tag_name).indices.push(id);
    //         song.trans_lyrics = [song.trans_lyrics_1, song.trans_lyrics_2, song.trans_lyrics_3, song.trans_lyrics_4]
    //         this.songs.push(song);
    //       })
    //       return this.save_songs().then(() => {
    //         return "ok songs";
    //       });
    //     }
    //   );

    return this.firestore
      .collection("songs_collec")
      .doc("songs_doc")
      .get()
      .toPromise()
      .then(
        doc => {
          this.tags.push({
            type: 'genre',
            name: 'english',
            lang: 'en',
            indices: [],
          });
          this.tags.push({
            type: 'genre',
            name: 'french',
            lang: 'fr',
            indices: [],
          });
          doc.data()['songs'].forEach((song, id) => {
            id++;
            // console.log(id,song);
            // Language
            if (song.tag.type == "genre") {
              if (song.src_lang == "fr") {
                this.tags.find(x => x.name == "french").indices.push(id);
              } else {
                this.tags.find(x => x.name == "english").indices.push(id);
              }
            }

            // Genre and artists tags
            if (!this.tags.find(x => x.name == song.tag.name)) {
              this.tags.push({
                type: song.tag.type,
                name: song.tag.name,
                lang: song.tag.lang,
                indices: [],
              });
            }
            this.tags.find(x => x.name == song.tag.name).indices.push(id);
            this.songs.push(song);
          })
          return this.save_songs().then(() => {
            // Save number of tags and number of songs
            let dataMeta = ["tags", this.tags.length];
            return this.database.executeSql("INSERT INTO MetaInfo (name, number) VALUES (?, ?)", dataMeta).then(() => {
              let dataSongs = ["songs", this.songs.length];
              return this.database.executeSql("INSERT INTO MetaInfo (name, number) VALUES (?, ?)", dataSongs).then(() => {
                return "ok songs";
              });
            });
          });
        }
      );
  }





  public save_songs() {
    if (this.useSQLite) {
      let id = 1;
      let data = [];
      let query = "INSERT INTO Songs (id, artist, title, trans_lyrics_1, trans_lyrics_2, trans_lyrics_3, trans_lyrics_4) VALUES "
      let rowArgs = [];
      for (let song of this.songs) {
        rowArgs.push("(?, ?, ?, ?, ?, ?, ?)");
        data.push(id);
        data.push(song.artist);
        data.push(song.title);
        data.push(song.trans_lyrics[0]);
        data.push(song.trans_lyrics[1]);
        data.push(song.trans_lyrics[2]);
        data.push(song.trans_lyrics[3]);
        id++;
      }
      query += rowArgs.join(", ");
      // console.log(query);
      // console.log(data);
      return this.database.executeSql(query, data).then(() => {
      });
      // for (let song of this.songs.slice(0, 2)) {
      //   data = [id, song.artist, song.title, song.trans_lyrics[0], song.trans_lyrics[1], song.trans_lyrics[2], song.trans_lyrics[3]];
      //   this.database.executeSql("INSERT INTO Songs (id, artist, title, trans_lyrics_1, trans_lyrics_2, trans_lyrics_3, trans_lyrics_4) VALUES (?,?,?,?,?,?,?)", data);
      //   id++;
      // }
    } else {
      return this.storage.ready().then(() => {
        let id = 1;
        for (let song of this.songs) {
          this.storage.set(id.toString(), JSON.stringify({
            artist: song.artist,
            title: song.title,
            lyrics: song.trans_lyrics,
          }));
          id++;
        }
      });
    }
  }





  public save_indices() {
    if (this.useSQLite) {
      let data = [];
      let query = "INSERT INTO Tags (type, lang, name, indices) VALUES "
      let rowArgs = [];
      for (let tag of this.tags) {
        rowArgs.push("(?, ?, ?, ?)");
        data.push(tag.type);
        data.push(tag.lang);
        data.push(tag.name);
        data.push(JSON.stringify(tag.indices));
      }
      query += rowArgs.join(", ");
      return this.database.executeSql(query, data).then(() => {
        return "ok indices";
      });
    } else {
      return this.storage.ready().then(() => {
      // this.storage.ready().then(() => {    // XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
        this.storage.set("tags", JSON.stringify(this.tags));
        return "ok indices";
      });
    }
  }




  // public fill_db() {
  //   return this.firestore
  //     .collection("songs")
  //     .get()
  //     .toPromise()
  //     .then(
  //       collec => {
  //         collec.forEach((doc) => {
  //           if (doc.id != "version_doc" && Object.keys(doc.data()).length > 0) {
  //             let indices = [];
  //             let data = doc.data();
  //             for (let id in data) {
  //               indices.push(Number(id));
  //               let value = data[id];
  //               this.storage.ready().then(() => {
  //                 console.log(id);
  //                 this.storage.set(id, JSON.stringify({
  //                   artist: value.artist,
  //                   title: value.title,
  //                   lyrics: value.lyrics,
  //                 }));
  //               });
  //             }
  //             this.questionIndices.set(doc.id, indices);
  //             this.storage.ready().then(() => {
  //               this.storage.set("questionIndices", JSON.stringify([...this.questionIndices]));
  //             });
  //           }
  //         })
  //       }
  //     );
  // }





  public retrieve_indices() {
    if (this.useSQLite) {
      return this.database.executeSql("SELECT * FROM Tags", []).then((res) => {
        if (res.rows.length > 0) {
          for (var i = 0; i < res.rows.length; i++) {
            this.tags.push({
              type: res.rows.item(i).type,
              name: res.rows.item(i).name,
              lang: res.rows.item(i).lang,
              indices: JSON.parse(res.rows.item(i).indices || '[]'),
            });
          }
        }
      });
    } else {
      return this.storage.get('tags').then((res) => {
        this.dbName = this.storage.driver;
        this.tags = JSON.parse(res || '{}');
      });
    }
  }






  //   return this.read_csv().then((res) => {   //wait for http
  //     console.log("HTTP: ", res);
  //     return this.delete_local_DB().then(() => {   //wait for storage
  //       return this.update_local_DB().then(() => {   //wait for storage
  //         });
  //       });
  //   });
  // }
  //
  //
  //
  // private update_local_db() {
  //   return this.storage.ready().then(() => {
  //     this.dbName = this.storage.driver;
  //     this.storage.set('totalNbQuestions', this.csvData.length.toString());
  //     for (let i = 0; i < this.csvData.length; i++) {
  //       this.storage.set(String(i+1), JSON.stringify({
  //         artist: this.csvData[i][1],
  //         title: this.csvData[i][2],
  //         lyrics: this.csvData[i][3]
  //       }));
  //     }
  //   });
  // }





  //
  //
  // private read_csv() {
  //   return this.http.get(this.httpAddress, {responseType: 'text'})
  //     .toPromise()
  //     .then(
  //       data => {
  //         let parsedData = papa.parse(data).data;
  //         console.log(data);
  //         console.log(parsedData);
  //         // this.header = parsedData[0];
  //         parsedData.splice(0, 1);
  //         if (parsedData[parsedData.length - 1] == "") {
  //           parsedData.splice(-1,1);
  //         }
  //         this.csvData = parsedData;
  //         this.totalNbQuestions = this.csvData.length;
  //       },
  //       err => {
  //         console.log('something went wrong: ', err);
  //       }
  //     );
  // }





  private delete_local_db() {
    if (this.useSQLite) {
      this.database.executeSql("DELETE FROM MetaInfo", [])
      this.database.executeSql("DELETE FROM Tags", [])
      return this.database.executeSql("DELETE FROM Songs", []).then(() => {
      });
      // return this.database.executeSql("DELETE FROM MetaInfo; " +
      // "DELETE FROM Tags; " +
      // "DELETE FROM Songs;", []).then(() => {
      //   return true;
      // });
    } else {
      return this.storage.clear().then(() => {
      });
    }
  }





  public is_storage_ready() {
    if (this.useSQLite) {
      return this.database.executeSql("SELECT * FROM Tags", []).then((data) => {
        if (data.rows.length > 0) {
          return true;
        } else {
          return false;
        }
      });
    } else {
      return this.storage.ready().then(() => {
        return this.storage.get('tags').then((res) => {
          return true;
        });
      });
    }
  }






  public get_playable_tags(nbQuestionQuiz: number, nbOptions: number) {
    this.nbQuestionQuiz = nbQuestionQuiz;
    this.nbOptions = nbOptions;
    let tags = this.tags;
    // Remove genres and artist with less than nbQuestionQuiz * nbOptions songs
    tags = tags.filter(x => x.indices.length > nbQuestionQuiz * nbOptions);
    // tags = tags.filter(x => x.indices.length > 0);
    return tags;
  }











  public get_tag_indices() {
    return this.tags.find(x => x.name == this.tagName).indices;
  }








  public get_lyrics(id: string) {
    if (this.useSQLite) {
      let data = [id];
      return this.database.executeSql("SELECT trans_lyrics_1, trans_lyrics_2, trans_lyrics_3, trans_lyrics_4 FROM Songs WHERE id = ?", data).then((res) => {
        let lyrics = res.rows.item(0)
        return [lyrics.trans_lyrics_1, lyrics.trans_lyrics_2, lyrics.trans_lyrics_3, lyrics.trans_lyrics_4];
      });
    } else {
      return this.storage.get(id).then((res) => {
        let obj = JSON.parse(res || '{}');
        // let lyrics = obj.lyrics.join("\n");
        // return lyrics;
        return obj.lyrics;
      });
    }
  }



  public get_title(id: string) {
    if (this.useSQLite) {
      let data = [id];
      return this.database.executeSql("SELECT artist, title FROM Songs WHERE id = ?", data).then((res) => {
        let title = res.rows.item(0).title;
        if (this.tags.find(x => x.name == this.tagName).type == "genre") {
          title += " by " + res.rows.item(0).artist;
        }
        return title;
      });
    } else {
      return this.storage.get(id).then((res) => {
        let obj = JSON.parse(res || '{}');
        let title = obj.title;
        if (this.tags.find(x => x.name == this.tagName).type == "genre") {
          title += " by " + obj.artist;
        }
        return title;
      });
    }
  }





}








export interface Tag {
    type: string;
    name: string;
    lang: string;
    indices: number[];
}





// this.http.get('https://raw.githubusercontent.com/fgeoffroy/fgeoffroy.github.io/master/questions.csv', {}, {})
// .then(data => {
//   let stringCSV = data.data;
//   console.log(stringCSV);
//   // console.log("data.status", data.status);
//   // console.log("data.data", data.data); // data received by server
//   // console.log("data.headers", data.headers);
// })
// .catch(error => {
//   console.log("error.status: ", error.status);
//   console.log("error.error: ", error.error); // error message as string
//   console.log("error.headers: ", error.headers);
//   });

// this.sqlite.create({
//   name: 'data.db',
//   location: 'default'
// })
//   .then((db: SQLiteObject) => {
//     this.dbName = "CREATED";
//     db.executeSql('CREATE TABLE danceMoves(id PRIMARY KEY, artist TEXT, title TEXT, artist TEXT)', [])
//       .then(() => console.log('Executed SQL'))
//       .catch(e => console.log(e));
//     // csvData.forEach(function (value) {
//     //   db.executeSql('CREATE TABLE danceMoves(id PRIMARY KEY, artist TEXT, title TEXT, artist TEXT)', [])
//     //     .then(() => console.log('Executed SQL'))
//     //     .catch(e => console.log(e));
//     // };
//   })
//   .catch(e => console.log(e));
