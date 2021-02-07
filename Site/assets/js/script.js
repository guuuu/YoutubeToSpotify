const express = require("express");
const app = express();
const port = process.env.PORT || 8080
const bodyParser = require("body-parser");
const gl = require("./gl");
const request = require("request");

let google_user = "Not logged in";
let spotify_user = "Not logged in";
let yt_pl = "-";
let sp_pl = "-";
let yt_songs = "-";
let sp_songs = "-";

app.set("view engine", "ejs");
app.use(express.static(__dirname + "\\..\\.."));
app.use(bodyParser.json());

app.get("/", (req, res) => {
    res.render("index", {
        google_user: google_user,
        spotify_user: spotify_user,
        yt_pl: yt_pl,
        sp_pl: sp_pl,
        yt_songs: yt_songs,
        sp_songs: sp_songs
    });

    res.status(200);
    res.end();
});

app.get("/gl", (req, res) => {
    res.redirect(gl.urlGoogle());
});


app.get("/gl_success", (req, res) => {
    let code = decodeURIComponent(req.url.toString().split("code=")[1].split("&scope")[0]);

    request(gl.tokens(code), (err, res2, body) => {
        let request_userinfo = "https://www.googleapis.com/oauth2/v3/userinfo?access_token=" + body.split('"access_token": "')[1].split('"')[0]

        request(request_userinfo, (err, res2, body) => {
            res.render("index", {
                google_user: body.split('"email": "')[1].split('"')[0],
                spotify_user: spotify_user,
                yt_pl: yt_pl,
                sp_pl: sp_pl,
                yt_songs: yt_songs,
                sp_songs: sp_songs
            });
        
            res.status(200);
            res.end();
        })
    });


});

app.listen(port, console.log(`Server listening in port ${port}`));