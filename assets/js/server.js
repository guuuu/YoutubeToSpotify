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

// "directed"
// "prod"
// "feat"
// "ft"
// "dir"

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


app.get("*", (req, res) => {
    res.status(200).sendFile(path.join(__dirname, path.join("..", path.join("..", "index.html"))));
});

app.post("/load_yt_playlist", (req, res) => {
    let playlist_id = String(req.body.yt_url).split("list=")[1];
    let songs = [];
    //console.log(playlist_id);

    const yt_request = (playlist_id, pt) => {
        axios.get(`https://www.googleapis.com/youtube/v3/playlistItems?part=snippet&playlistId=${playlist_id}&key=${process.env.YT_API_KEY}&pageToken=${pt}`)
        .then(response => {
            response.data.items.forEach(item => { 
                try {
                    songs.push({
                        "title": String(item.snippet.title),
                        "thumbnail": String(item.snippet.thumbnails.high.url),
                    });
                } catch (error) {
                    try {
                        songs.push({
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
                songs.push({
                    "total": parseInt(String(response.data.pageInfo.totalResults)),
                    "owner": String(response.data.items[0].snippet.channelTitle)
                });

                for (let i = 0; i < songs.length - 1; i++){
                    
                    try{ //remove common words
                        //songs[i].title = songs[i].title.replace(/[^\x00-\x7F]/g, " ").replace(/[^\w\s]/gi, ' '); //remove non ascii and special characters
                        songs[i].title = songs[i].title.replace(/[^\x00-\x7F]/g, " ").replace(/[^\word\s]/gi, ' '); //remove non ascii and special characters
                        
                        common_words.forEach((word) => {
                            if(songs[i].title.toLowerCase().includes(word)){
                                songs[i].title = songs[i].title.toLowerCase().replace(word, ""); //remove common words
                            }
                        });
                        
                        try{ songs[i].title = songs[i].title.toLowerCase().split("prod")[0].trim();     }   catch{ continue; }
                        try{ songs[i].title = songs[i].title.toLowerCase().split("directed")[0].trim(); }   catch{ continue; }
                        try{ songs[i].title = songs[i].title.toLowerCase().split("dir")[0].trim();      }   catch{ continue; }
                        try{ songs[i].title = songs[i].title.toLowerCase().split("ft")[0].trim();       }   catch{ continue; }

                        songs[i].title = songs[i].title.replace(/\s{2,}/g,' '); //remove multiple spaces from string
                    }
                    catch(e) { continue; }
                }

                res.status(200).send({data: songs});
            } 
        })
        .catch(error => { console.error(error); res.status(400).send({data: null}) });
    }

    yt_request(playlist_id, "");
});

app.post("/merge_pl", (req, res) => {
    let songs = JSON.parse(req.body.titles);

    let aux_songs = [];
    let counter_songs = 0;

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

    let found_songs = [];
    let not_found_songs = [];

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
                let search_song = (song_name) => {
                    axios.get(`https://api.spotify.com/v1/search?q=${encodeURIComponent(song_name)}&type=track&limit=1&offset=0`, {headers: headers}) //Search the songs
                    .then((response_songs) => {
                        try{ 
                            if(aux_songs.length < 50){
                                aux_songs.push(response_songs.data.tracks.items[0].uri)
                            }
                            else{
                                found_songs.push(aux_songs); 
                                aux_songs = [];
                            }
                        }
                        catch(e){ not_found_songs.push(songs[songs.length - 1])}
                        songs.pop()

                        if(songs.length > 0){ search_song(songs[songs.length - 1]) }
                        else{
                            found_songs.push(aux_songs);
                            //console.log(aux_songs);
                            let add_song = () => {
                                axios.post(`https://api.spotify.com/v1/playlists/${response_pl.data.id}/tracks?position=0&uris=${found_songs[0].join()}`, null, {headers: headers}) //Add the songs to the playlist
                                .then((response_inserted) => {
                                    if(found_songs.length > 0){
                                        counter_songs += found_songs[0].length
                                        found_songs.splice(0, 1);
                                        if(found_songs.length !== 0){
                                            add_song();
                                        }
                                        else{
                                            console.log(not_found_songs);
                                            res.status(200).send({data: `Found a total of ${counter_songs} in ${not_found_songs.length + counter_songs}`});
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
            .catch((error_pl) => { console.log(error_pl); })
        })
        .catch((err_info) => { console.log(err_info); })
    })
    .catch((error_token) => { console.log(error_token); })
});

app.listen(port, console.log(`Server listening on port ${port}`));