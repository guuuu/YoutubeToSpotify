const express = require("express");
const app = express();
const port = process.env.PORT || 8080
const path = require("path");
const fs = require("fs");
const html_path = path.join(__dirname, "..\\..");
const default_folder = path.join(__dirname, "..\\..\\");
const default_file = path.join(__dirname, "..", "..", "index.html")
app.use(express.static(default_folder))

app.get('/:page', function(req, res) {
    let req_file = path.join(html_path, req.originalUrl + ".html");

    try {
        fs.access(req_file, fs.F_OK, (err) => {
            if (err){
                res.status(404);
                res.sendFile(default_file);
            }
            else{
                res.status(200);
                res.sendFile(req_file);
            }
        });    
    } catch (error) {
        res.status(404);
        res.sendFile(req_file);
    }
});

app.listen(port, console.log(`Server listening in port ${port}`));