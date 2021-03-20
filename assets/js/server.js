const bodyParser = require("body-parser");
const port = process.env.PORT || 8080;
const express = require("express");
const axios = require('axios');
const path = require("path");
const app = express();

app.use(express.static(__dirname + "\\..\\.."));
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

app.get("*", (req, res) => {
    res.status(200).sendFile(path.join(__dirname, path.join("..", path.join("..", "index.html"))));
});

app.post("/load_yt_playlist", (req, res) => {
    let playlist_id = String(req.body.yt_url).split("list=")[1];
    let titles = [];

    const yt_request = (playlist_id, pt) => {
        axios.get(`https://www.googleapis.com/youtube/v3/playlistItems?part=snippet&playlistId=${playlist_id}&key=${process.env.YT_API_KEY}&pageToken=${pt}`)
        .then(response => {
            response.data.items.forEach(item => { titles.push(item.snippet.title); });
            if(response.data.nextPageToken) yt_request(playlist_id, response.data.nextPageToken);
            else res.status(200).send({data: titles});
        })
        .catch(error => { console.error(error); });
    }

    yt_request(playlist_id, "");
});

app.listen(port, console.log(`Server listening on port ${port}`));