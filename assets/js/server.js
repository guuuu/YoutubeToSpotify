const SpotifyWebApi = require("spotify-web-api-node");
const nodeBase64 = require('nodejs-base64-converter');
const bodyParser = require("body-parser");
const port = process.env.PORT || 8080;
const express = require("express");
const axios = require('axios');
const path = require("path");
const app = express();

const sp_id = "1a724cc7f36547cfaa1c851b26deebe1";
const sp_sc = "3734f25cfd364cc4a037ffd8d47564ba";
const scopes = ["playlist-modify-public", "playlist-modify-private"];
const spotify = new SpotifyWebApi({
    clientId: sp_id,
    redirectUri: "http://192.168.1.117:8080/logged"
});

const common_words = [
    "wshh exclusive official music video",
    "official animated music video",
    "official hd music video",
    "official music video",
    "video clip official",
    "videoclip oficial",
    "vertical video",
    "wshh exclusive",
    "official video",
    "official audio",
    "video official",
    "clipe ofiical",
    "video oficial",
    "original mix",
    "bass boosted",
    "music video",
    "lyric video",
    "visualizer",
    "lyrics",
    "audio",
    "feat",
    "ft"
];

let yt_songs = [];
let yt_loading = false;

let sp_searched_songs = [];
let sp_searching = false;

let sp_counter_songs = 0;
let sp_loading = false;

/*
TODO Controlar melhor os nomes das musicas, retirar oficial audio, oficial video, prod etc, meter respostas corretas em caso de erro
    aceitar caracteres espciais tp ã õ etc

    Fazer um metodo get em q devolva a quantidade de sons q ja foram carregados tanto do yt como no spotify

    Arranjar forma de q este grupo de caracteres (?:\u00C0-\u00FF)
    nao seja removido
    
*/

app.use(express.static(__dirname + "\\..\\.."));
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

app.get("/login_sp", (req, res) => {
    let state = "abcd";
    let authorizeURL = spotify.createAuthorizeURL(scopes, state, true);
    res.status(200).send({url: authorizeURL});
});

app.get("/yt_loading_status", (req, res) => {
    if(!yt_loading){ res.status(200).send({code: 0, message: "There's no songs currently being searched or being added to a spotify playlist"}); }
    else{ res.status(200).send({code: 1, message: String(yt_songs.length)}) }
});

app.get("/sp_loading_status", (req, res) => {
    if(!sp_loading && !sp_searching){ res.status(200).send({code: 0, message: "There's no songs currently loading from the youtube API"}); }
    else if(sp_searching && !sp_loading) { res.status(200).send({code: 1, message: String(sp_searched_songs.length) }) }
    else if(!sp_searching && sp_loading) { res.status(200).send({code: 2, message: String(sp_counter_songs) }) }
    else{ res.status(200).send({code: 0, message: "Something went wrong, try reloading the page..."}) }
});

app.get("*", (req, res) => {
    res.status(200).sendFile(path.join(__dirname, path.join("..", path.join("..", "index.html"))));
});

app.post("/load_yt_playlist", (req, res) => {
    let playlist_id = String(req.body.yt_url).split("list=")[1];

    yt_songs = [];

    const yt_request = (playlist_id, pt) => {
        axios.get(`https://www.googleapis.com/youtube/v3/playlistItems?part=snippet&playlistId=${playlist_id}&key=${process.env.YT_API_KEY}&pageToken=${pt}`)
        .then(response => {
            yt_loading = true;
            response.data.items.forEach(item => { 
                try {
                    yt_songs.push({
                        "title": String(item.snippet.title),
                        "thumbnail": String(item.snippet.thumbnails.high.url),
                    });
                } catch (error) {
                    try {
                        yt_songs.push({
                            "title": String(item.snippet.title),
                            "thumbnail": null,
                        });
                    } catch (error) {}
                }
            });

            if(response.data.nextPageToken){
                 yt_request(playlist_id, response.data.nextPageToken);
            }
            else {
                yt_songs.push({
                    "total": parseInt(String(response.data.pageInfo.totalResults)),
                    "owner": String(response.data.items[0].snippet.channelTitle)
                });

                for (let i = 0; i < yt_songs.length - 1; i++){
                    
                    try{ //remove common words
                        //yt_songs[i].title = yt_songs[i].title.replace(/[^\x00-\x7F]/g, " ").replace(/[^\w\s]/gi, ' '); //remove non ascii and special characters
                        yt_songs[i].title = yt_songs[i].title.replace(/[^\x00-\x7F]/g, " ").replace(/[^\word\s]/gi, ' '); //remove non ascii and special characters
                        
                        common_words.forEach((word) => {
                            if(yt_songs[i].title.toLowerCase().includes(word)){
                                yt_songs[i].title = yt_songs[i].title.toLowerCase().replace(word, ""); //remove common words
                            }
                        });
                        
                        try{ yt_songs[i].title = yt_songs[i].title.toLowerCase().split("prod")[0].trim();     }   catch{ continue; }
                        try{ yt_songs[i].title = yt_songs[i].title.toLowerCase().split("directed")[0].trim(); }   catch{ continue; }
                        try{ yt_songs[i].title = yt_songs[i].title.toLowerCase().split("dir")[0].trim();      }   catch{ continue; }
                        try{ yt_songs[i].title = yt_songs[i].title.toLowerCase().split("ft")[0].trim();       }   catch{ continue; }

                        yt_songs[i].title = yt_songs[i].title.replace(/\s{2,}/g,' '); //remove multiple spaces from string
                    }
                    catch(e) { continue; }
                }

                yt_loading = false;
                res.status(200).send({data: yt_songs});
            } 
        })
        .catch(error => { res.status(200).send({code: -1, message: "Couldn't load the youtube playlist", details: error}); });
    }

    yt_request(playlist_id, "");
});

app.post("/merge_pl", (req, res) => {
    let songs = JSON.parse(req.body.titles);

    let sp_found_songs = [];
    let not_found_songs = [];

    sp_searched_songs = [];
    sp_counter_songs = 0;

    let headers_token = {
        "Authorization": "Basic " + String(nodeBase64.encode(`${sp_id}:${sp_sc}`)),
        "Content-Type": "application/x-www-form-urlencoded"
    }

    let headers = {
        "Accept": "application/json",
        "Content-Type": "application/json",
        "Authorization": null
    }

    let data = { //playlist properties
        "name": JSON.parse(req.body.name),
        "description": JSON.parse(req.body.desc),
        "public": JSON.parse(req.body.public)
    }


    for(let i = 0; i < songs.length; i++)
        if(songs[i] === "")
            songs.splice(i, 1);

    axios.post(`https://accounts.spotify.com/api/token?grant_type=authorization_code&code=${JSON.parse(req.body.code)}&redirect_uri=http://192.168.1.117:8080/logged`, null, {headers: headers_token}) //Trocar auth code por access token
    .then((response_token) => {
        headers.Authorization = `${response_token.data.token_type} ${response_token.data.access_token}`; //set auth header to the access token
        axios.get("https://api.spotify.com/v1/me", {headers: headers})
        .then((response_info) => {
            axios.post(`https://api.spotify.com/v1/users/${response_info.data.id}/playlists`, data , { headers: headers }) //Create the playlist
            .then((response_pl) => {
                sp_searching = true;
                sp_loading = false;
                let search_song = (song_name) => {
                    axios.get(`https://api.spotify.com/v1/search?q=${encodeURIComponent(song_name)}&type=track&limit=1&offset=0`, {headers: headers}) //Search the songs
                    .then((response_songs) => {
                        try{ 
                            if(sp_searched_songs.length < 50){
                                sp_searched_songs.push(response_songs.data.tracks.items[0].uri)
                            }
                            else{
                                sp_found_songs.push(sp_searched_songs); 
                                sp_searched_songs = [];
                            }
                        }
                        catch(e){ not_found_songs.push(songs[songs.length - 1])}
                        songs.pop()

                        if(songs.length > 0){ search_song(songs[songs.length - 1]) }
                        else{
                            sp_searching = false;
                            sp_loading = true;
                            sp_found_songs.push(sp_searched_songs);
                            //console.log(sp_searched_songs);
                            let add_song = () => {
                                axios.post(`https://api.spotify.com/v1/playlists/${response_pl.data.id}/tracks?position=0&uris=${sp_found_songs[0].join()}`, null, {headers: headers}) //Add the songs to the playlist
                                .then((response_inserted) => {
                                    if(sp_found_songs.length > 0){
                                        sp_counter_songs += sp_found_songs[0].length
                                        sp_found_songs.splice(0, 1);
                                        if(sp_found_songs.length !== 0){
                                            add_song();
                                        }
                                        else{
                                            sp_loading = false;
                                            res.status(200).send({
                                                found: String(sp_counter_songs),
                                                not_found: String(not_found_songs.length),
                                                total: not_found_songs.length + sp_counter_songs,
                                                not_found_titles: not_found_songs,
                                                found_titles: JSON.parse(req.body.titles)
                                            });
                                        }
                                    }

                                })
                                .catch((error_inserted) => { console.log(error_inserted); })
                            }

                            add_song();
                        }
                    })
                    .catch((error_songs) => { console.log(error_songs); })
                }
                search_song(songs[songs.length - 1])
            })
            .catch((error_pl) => { res.status(200).send({code: -1, message: "Couldn't create the spotify playlist", details: error_pl}); })
        })
        .catch((err_info) => { res.status(200).send({code: -1, message: "Something went wrong, try logging in to your account again", details: err_info}); })
    })
    .catch((error_token) => { res.status(200).send({code: -1, message: "Something went wrong, try logging in to your account again", details: error_token}); })
});

app.listen(port, console.log(`Server listening on port ${port}`));