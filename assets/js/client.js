let songs = [];
let sp_code = "";

$("#sp_log").on("click", () => { //login to spotify
  let re = new RegExp("^(http:\/\/|https:\/\/)(youtube.com|www.youtube.com)\/(playlist\\?list=|watch\\?v=)");
  let res = re.exec($("#yt_url").val())
  if(res !== null && res.length > 2){

    localStorage.setItem("url", String($("#yt_url").val()))

    $.ajax({
      url: "/login_sp",
      type: "GET"
    })
    .done((response) => {
      if(response.url !== null){ window.location.href = response.url; }
      else{ show_error(3, "We couldn't log you in to your spotify account, try again in a few minutes...") }
    })
  }
  else{
    show_error(2, "That doesn't seem like an valid youtube url, if you think that's a mistake please report this&nbsp;<a href='https://github.com/guuuu/YoutubeToSpotify/issues/new' target='blank'> issue</a>");
  }
});

$(document).ready(() => { //load the playlist after being redirected from the sp API
  youtube_loading_status();

  if(localStorage.getItem("lights") === "true"){ lights(true); }

  if($(location).attr("href").includes("logged") && $(location).attr("href").includes("error")){
    show_error(2, "The permission to your spotify account was denied, to use this app, please login again and allow the app...");
    window.history.pushState('', '', '/');
  }
  else if($(location).attr("href").includes("logged")){
    $("#s1").addClass("hide");
    $("#loading").removeClass("hide");
    $("#loading_status").removeClass("hide");
    $("#note").text("")
    $("#step").text("Step 2 - 4 > Choose songs");
    $("#songs").empty();
    let interval_id = setInterval(youtube_loading_status, 500);

    let tc = 0;
    $.ajax({
        url: '/load_yt_playlist',
        type:'POST',
        data: {"yt_url": localStorage.getItem("url") }
      })
      .done(response => {
        if(response.data !== null){
          sp_code = window.location.href.split("code=")[1].split("&")[0];
          window.history.pushState('', '', '/');
          let aux = response.data[response.data.length - 1];
          response.data.pop(response.data.length - 1)
          response["data"].forEach(song => {
            if(localStorage.getItem("lights") === "true"){
              $("#songs").append(`
                <div class="song">
                    <div class="thumbnail ln-light">
                        <div class="check ln-light hide" id="yt_ch${tc}">
                            <img src="assets/images/check.png" alt="checkmark" class="img_check hide">
                        </div>
                    </div>
                    <div class="ln-light s_name">
                        <input type="text" class="song_name txt-light readonly" value="${song.title}">
                    </div>
                </div>
              `);
            }
            else{
              $("#songs").append(`
                <div class="song">
                    <div class="thumbnail ln-dark">
                        <div class="check ln-dark hide" id="yt_ch${tc}">
                            <img src="assets/images/check.png" alt="checkmark" class="img_check hide">
                        </div>
                    </div>
                    <div class="ln-dark s_name">
                        <input type="text" class="song_name txt-dark" readonly value="${song.title}">
                    </div>
                </div>
              `);
            }
  
            $($(".thumbnail")[tc]).css("background", `url(${song.thumbnail}) no-repeat center`);
            tc++;
            songs.push(song.title);
          });
          $("#loading").addClass("hide");
          $("#loading_status").addClass("hide");
          clearInterval(interval_id);
          $("#s2").removeClass("hide");
        }
        else{
          show_error(3, response.details);
          $("#loading").addClass("hide");
          $("#loading_status").addClass("hide");
          clearInterval(interval_id);
          $("#s1").removeClass("hide");
          $("#step").text("Step 1 - 4 > Login to spotify & load a youtube playlist");
        }
      });
  }
});

$("#details").on("click", () => { //define the playlist name and description
  $("#s2").addClass("hide");
  $("#note").text("")
  $("#step").text("Step 3 - 4 > Set playlist name & description");
  $("#s3").removeClass("hide");
});

$("#merge").on("click", () => { //add the songs to spotify
  $("#s3").addClass("hide");
  $("#loading").removeClass("hide");
  $("#loading_status").removeClass("hide");
  $("#step").text("Waiting for results");

  if(songs.length >= 1){
    let interval_id = setInterval(spotify_loading_status, 500);

    $.ajax({
      url: "/merge_pl",
      type: "POST",
      data: {
        titles: JSON.stringify(songs),
        code: JSON.stringify(sp_code),
        public: JSON.stringify($("#pl_check").is(":checked")),
        name: JSON.stringify($("#pl_name").val()),
        desc: JSON.stringify($("#pl_desc").val())
      }
    }).done((response) => {
      if(response.data !== null){
        let h2 = document.createElement("h2");
        $(h2).addClass("nf_title");
        let l = localStorage.getItem("lights") === "true" ? true : false;
        
        if(l){ $(h2).addClass("tt-light") }
        else{ $(h2).addClass("tt-dark") }
  
        $("#loading").addClass("hide");
        $("#loading_status").addClass("hide");
        clearInterval(interval_id);
        $("#step").text("Step 4 - 4 > Results");
        $("#s4").removeClass("hide");
        localStorage.clear();
  
        if(response.not_found > 0){
          if(l)
            $("#s4").append($(h2).html(`We couldn't find <mark class='bt-light'>${response.not_found}</mark> songs in a total of <mark class='bt-light'>${response.total}</mark> songs (<mark class='bt-light'>${parseInt((response.not_found/response.total)*100)}%</mark>) :`))
          else
            $("#s4").append($(h2).html(`We couldn't find <mark class='bt-dark'>${response.not_found}</mark> songs in a total of <mark class='bt-dark'>${response.total}</mark> songs (<mark class='bt-dark'>${parseInt((response.not_found/response.total)*100)}%</mark>) :`))
          response.not_found_titles.forEach((title) => {
            let p = document.createElement("p");
            if(l){ $(p).addClass("tt-light"); }
            else{ $(p).addClass("tt-dark"); }
  
            p.appendChild(document.createTextNode("\u25E6 " + String(title)))
            $("#nf_songs").append(p);
            if(response.pl_url !== null)
              window.open(response.pl_url, "_blank");
          })
        }
        else{
          $($(h2).removeClass("nf_title")).addClass("nf_title2");
          $("#s4").append($(h2).text("All songs were found and added to the spotify playlist!"))
          if(response.pl_url !== null)
            window.open(response.pl_url, "_blank");
        }
      }
      else{
        show_error(3, response.details);
        $("#loading").addClass("hide");
        $("#loading_status").addClass("hide");
        clearInterval(interval_id);
        $("#s3").removeClass("hide");
      }
    }).fail((xhr, status, error) => {
      show_error(3, "Something went wrong...");
      $("#loading").addClass("hide");
      $("#loading_status").addClass("hide");
      clearInterval(interval_id);
      $("#s3").removeClass("hide");
    })
  }
})

$("#radio").click(function() { //dark / light mode
  if(localStorage.getItem("lights") === "false" || localStorage.getItem("lights") === null){ lights(true); }
  else{ lights(false); }
});

function lights(on){  
  if(on){
    localStorage.setItem("lights", "true");
    $("#radio").css("align-items", "flex-start");
    $(".bg-dark").each(function(){ $(this).addClass("bg-light").removeClass("bg-dark"); });
    $(".txt-dark").each(function(){ $(this).addClass("txt-light").removeClass("txt-dark"); });
    $(".bt-dark").each(function(){ $(this).addClass("bt-light").removeClass("bt-dark"); });
    $(".ln-dark").each(function(){ $(this).addClass("ln-light").removeClass("ln-dark"); });
    $(".tt-dark").each(function(){ $(this).addClass("tt-light").removeClass("tt-dark"); });
    $(".stt-dark").each(function(){ $(this).addClass("stt-light").removeClass("stt-dark"); });
    $(".rd-dark").each(function(){ $(this).addClass("rd-light").removeClass("rd-dark"); });
    $("#d1, #d2").addClass("bg-dark").removeClass("bg-light");
  }
  else{
    localStorage.setItem("lights", "false");
    $("#radio").css("align-items", "flex-end");
    $(".bg-light").each(function(){ $(this).addClass("bg-dark").removeClass("bg-light"); });
    $(".txt-light").each(function(){ $(this).addClass("txt-dark").removeClass("txt-light"); });  
    $(".bt-light").each(function(){ $(this).addClass("bt-dark").removeClass("bt-light"); });
    $(".ln-light").each(function(){ $(this).addClass("ln-dark").removeClass("ln-light"); });
    $(".tt-light").each(function(){ $(this).addClass("tt-dark").removeClass("tt-light"); });
    $(".stt-light").each(function(){ $(this).addClass("stt-dark").removeClass("stt-light"); });
    $(".rd-light").each(function(){ $(this).addClass("rd-dark").removeClass("rd-light"); });
    $("#d1, #d2").addClass("bg-light").removeClass("bg-dark");
  }
}

function youtube_loading_status(){
  $.ajax({
    url: "/yt_loading_status",
    type: "GET"
  })
  .done((response) => {
    if(response.code === 0){
      $($("#loading_status").children()[0]).text(`${response.message}`);
    }
    else{
      $($("#loading_status").children()[0]).text(`Loaded ${response.message} songs`);
    }    
  })
}

function spotify_loading_status(){
  $.ajax({
    url: "/sp_loading_status",
    type: "GET"
  })
  .done((response) => {
    if(response.code === 0){
      $($("#loading_status").children()[0]).text(`${response.message}`);
    }
    else if(response.code === 1){
      $($("#loading_status").children()[0]).text(`Searched for ${response.message} songs`);
    }
    else {
      $($("#loading_status").children()[0]).text(`Added ${response.message} songs to the playlist`);
    }
  })
}

function show_error(code, message){
  $("#error").html(message);

  if(code === 1){
    $("#error").removeClass("hide_msg");
    $("#error").addClass("success");

    setTimeout(() => {
      $("#error").addClass("hide_msg");
      $("#error").removeClass("success");
    }, 4000);
  }
  else if(code === 2){
    $("#error").removeClass("hide_msg");
    $("#error").addClass("warn");

    setTimeout(() => {
      $("#error").addClass("hide_msg");
      $("#error").removeClass("warn");
    }, 4000);
  }
  else if(code === 3){
    $("#error").removeClass("hide_msg");
    $("#error").addClass("error");

    setTimeout(() => {
      $("#error").addClass("hide_msg");
      $("#error").removeClass("error");
    }, 4000);
  }
}

$("#ac").click(() => {
  location.reload();
})