const express = require("express");
const app = express();
const port = process.env.PORT || 8080
const bodyParser = require("body-parser");
const gl = require("./gl")

app.set("view engine", "ejs");
app.use(express.static(__dirname + "\\..\\.."));
app.use(bodyParser.json())

app.get("/", (req, res) => {
    res.render("index");
    res.status(200);
    res.end();
});

app.get("/gl", (req, res) => {
    res.redirect(gl.urlGoogle());
    // gl.getGoogleAccountFromCode();
    console.log(req.body);
});

app.listen(port, console.log(`Server listening in port ${port}`));




// const express = require("express");
// const app = express();
// const port = process.env.PORT || 8080
// const path = require("path");
// const fs = require("fs");
// const html_path = path.join(__dirname, "..\\..");
// const default_folder = path.join(__dirname, "..\\..\\");
// const default_file = path.join(__dirname, "..", "..", "index.html");
// const bodyParser = require("body-parser");

// app.use(bodyParser.urlencoded({ extended: false }));
// app.use(express.static(default_folder));
// app.use(bodyParser.json())

// app.get("/teste", (req, res) => {
//     // const { got } = req.body;
//     console.log(req.body.data);
// })

// app.get('/menu', (req, res) => {
//     let req_file = path.join(html_path, req.originalUrl + ".html");
    
//     try {
//         fs.access(req_file, fs.F_OK, (err) => {
//             if (err){
//                 res.status(404);
//                 res.sendFile(default_file);
//             }
//             else{
//                 res.status(200);
//                 res.sendFile(req_file);
//             }
//         });    
//     } catch (error) {
//         res.status(404);
//         res.sendFile(req_file);
//     }
// });

// app.get("/", (req, res) => {
//     res.status(404);
// });

// app.listen(port, console.log(`Server listening in port ${port}`));