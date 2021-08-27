const SpotifyWebApi = require("spotify-web-api-node");
const nodeBase64 = require('nodejs-base64-converter');
const bodyParser = require("body-parser");
const port = process.env.PORT || 8080;
const express = require("express");
const axios = require('axios');
const path = require("path");
const app = express();

const sp_id = String(process.env.sp_id);
const sp_sc = String(process.env.sp_sc);
const scopes = ["playlist-modify-public", "playlist-modify-private"];

const spotify = new SpotifyWebApi({
    clientId: sp_id,
    redirectUri: `https://${process.env.ytsp_redirect}/logged`
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

app.use(express.static(path.resolve("public")));
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

app.get("/login_sp", (req, res) => {
    try {
        let state = "abcd";
        let authorizeURL = spotify.createAuthorizeURL(scopes, state, true);
        res.status(200).send({url: authorizeURL});
    } catch (error) {
        console.error(error)
        res.status(200).send({url: null});
    }
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
    res.status(200).sendFile(path.resolve("index.html"));
});

app.post("/load_yt_playlist", (req, res) => {
    try {
        let playlist_id = String(req.body.yt_url).split("list=")[1];

        yt_songs = [];

        const yt_request = (playlist_id, pt) => {
            axios.get(`https://www.googleapis.com/youtube/v3/playlistItems?part=snippet&playlistId=${playlist_id}&key=${process.env.YT_API_KEY}&pageToken=${pt}`) //request yt API with PL ID, and page token (response gives page token if there's more pages to load)
            .then(response => {
                yt_loading = true;
                response.data.items.forEach(item => {  //get the title and thumbnail of each song retrivied from the API call
                    try {
                        yt_songs.push({
                            "title": String(item.snippet.title),
                            "thumbnail": String(item.snippet.thumbnails.high.url),
                        });
                    } catch (error) { //Song might not have a thumbnail in high resolution, so i push null as a thumnail
                        try {
                            yt_songs.push({
                                "title": String(item.snippet.title),
                                "thumbnail": null,
                            });
                        } catch (error) {}
                    }
                });

                if(response.data.nextPageToken){ //if the API call retrivied a page token, i use recursion to call the API again with the new page token
                    yt_request(playlist_id, response.data.nextPageToken);
                }
                else { //if not, get the total of songs in the PL and the owner of it
                    yt_songs.push({
                        "total": parseInt(String(response.data.pageInfo.totalResults)),
                        "owner": String(response.data.items[0].snippet.channelTitle)
                    });

                    for (let i = 0; i < yt_songs.length - 1; i++){ //Cleaning up song titles, since youtube API doesn't allow to access the metadata of Author and Song in each video...
                        
                        try{ //remove common words
                            yt_songs[i].title = yt_songs[i].title.replace(/[^\x00-\x7F]/g, " ").replace(/[^\word\s]/gi, ' '); //remove non ascii and special characters
                            
                            common_words.forEach((word) => { //Loop troughout a list of common words
                                if(yt_songs[i].title.toLowerCase().includes(word)){
                                    yt_songs[i].title = yt_songs[i].title.toLowerCase().replace(word, ""); //remove common words
                                }
                            });
                            
                            //More cleaning
                            try{ yt_songs[i].title = yt_songs[i].title.toLowerCase().split("prod")[0].trim();     }   catch{ continue; }
                            try{ yt_songs[i].title = yt_songs[i].title.toLowerCase().split("directed")[0].trim(); }   catch{ continue; }
                            try{ yt_songs[i].title = yt_songs[i].title.toLowerCase().split("dir")[0].trim();      }   catch{ continue; }
                            try{ yt_songs[i].title = yt_songs[i].title.toLowerCase().split("ft")[0].trim();       }   catch{ continue; }

                            yt_songs[i].title = yt_songs[i].title.replace(/\s{2,}/g,' '); //remove multiple spaces from string
                        }
                        catch(e) { continue; }
                    }

                    //When the loop ends, no more songs were in the playlist and titles are all cleaned up, so data it's now ready to be sent to client side
                    yt_loading = false;
                    res.status(200).send({data: yt_songs});
                } 
            })
            .catch(error => { //if anything goes wrong, it's catched here and controlled so the user knows what's going on (currently only handling error 404)
                console.error(error);
                if(error.response.status === 404){
                    res.status(200).send({
                        data: null,
                        details: "The playlist is not public / not listed, or doesn't exist..."
                    });
                }
                else{
                    res.status(200).send({
                        data: null,
                        details: "Unknown error occured while loading the youtube playlist, try again..."
                    });
                }
            });
        }

        yt_request(playlist_id, ""); //Start the recursion
    } catch (error) { //Something really bad happened
        console.error(error);
        res.status(200).send({data: null, details: "Something went wrong..."});
    }
});

app.post("/merge_pl", (req, res) => {
    try {
        let songs = JSON.parse(req.body.titles);
        songs = songs.reverse();
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

        if(String(JSON.parse(req.body.name)).trim() === ""){
            res.status(200).send({
                data: null,
                details: "Playlist name can't be empty"
            });
            return;
        }        

        let data = { //playlist properties
            "name": JSON.parse(req.body.name),
            "description": JSON.parse(req.body.desc),
            "public": JSON.parse(req.body.public)
        }

        let pl_url = null;

        for(let i = 0; i < songs.length; i++)
            if(songs[i] === "")
                songs.splice(i, 1);

        axios.post(`https://accounts.spotify.com/api/token?grant_type=authorization_code&code=${JSON.parse(req.body.code)}&redirect_uri=http://${process.env.ytsp_redirect}/logged`, null, {headers: headers_token}) //Change auth token for access token
        .then((response_token) => {
            headers.Authorization = `${response_token.data.token_type} ${response_token.data.access_token}`; //set auth header to the access token
            axios.get("https://api.spotify.com/v1/me", {headers: headers}) //Get the logged in account ID so the playlist can be created to it
            .then((response_info) => {
                axios.post(`https://api.spotify.com/v1/users/${response_info.data.id}/playlists`, data , { headers: headers }) //Create the playlist with the specified details
                .then((response_pl) => {
                    pl_url = response_pl.data.external_urls.spotify;
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
                            songs.pop() //Once the song was searched, pop it out the array, so when there's no more songs to search for, the recursion will stop

                            if(songs.length > 0){ search_song(songs[songs.length - 1]) }
                            else{
                                sp_searching = false;
                                sp_loading = true;
                                sp_found_songs.push(sp_searched_songs);
                                //console.log(sp_searched_songs);
                                let add_song = () => { //Before this, the songs were only being searched and being pushed with it's song ID of spotify to an array, now the songs will be added to the created PL
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
                                                    data: 1,
                                                    pl_url: pl_url,
                                                    found: String(sp_counter_songs),
                                                    not_found: String(not_found_songs.length),
                                                    total: not_found_songs.length + sp_counter_songs,
                                                    not_found_titles: not_found_songs,
                                                    found_titles: JSON.parse(req.body.titles)
                                                });
                                            }
                                        }

                                    })
                                    .catch((error_inserted) => { console.error(error_inserted); })
                                }

                                add_song();
                            }
                        })
                        .catch((error_songs) => { console.error(error_songs); })
                    }

                    search_song(songs[songs.length - 1]) //Start recursion
                })
                .catch((error_pl) => {
                    console.error(error_pl);
                    res.status(200).send({
                        data: null,
                        details: "Couldn't create the spotify playlist"
                    });
                });
            })
            .catch((err_info) => {
                console.error(err_info);
                res.status(200).send({
                    data: null,
                    details: "Couldn't get your spotify profile details (user ID), try logging in again..."
                });
            })
        })
        .catch((error_token) => {
            console.error(error_token);
            res.status(200).send({
                data: null,
                details: "Something went wrong, your spotify session might have timed out, try logging in again..."
            });
        })
    } catch (error) {
            console.error(error);
            res.status(200).send({
                data: null,
                details: "Something went wrong..."
            })
    }
});

app.listen(port, console.log(`Server listening on port ${port}`));