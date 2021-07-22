let songs = [];

//regex link yt
//^(https|http):\/\/(?:www\.)?youtube\.com\/playlist\?list=([a-zA-Z0-9_\-]{0})

$("#sp_log").on("click", () => { //login to spotify
  localStorage.setItem("url", String($("#yt_url").val()))

  $.ajax({
    url: "/login_sp",
    type: "GET"
  })
  .done((response) => {
    if(response !== null){ window.location.href = response.url; }
    else{ alert("enterro") }
  })
});

$(document).ready(() => { //load the playlist after being redirected from the sp API
  if(localStorage.getItem("lights") === "true"){ lights(true); }

  if($(location).attr("href").includes("logged")){
    $("#s1").addClass("hide");
    $("#loading").removeClass("hide");
    $("#note").text("")
    $("#step").text("Step 2 - 4 > Choose songs");
    $("#songs").empty();
    let tc = 0;
    $.ajax({
        url: '/load_yt_playlist',
        type:'POST',
        data: {"yt_url": localStorage.getItem("url") }
      })
      .done(response => {
        let aux = response.data[response.data.length - 1];
        response.data.pop(response.data.length - 1)
        response["data"].forEach(song => {
          if(localStorage.getItem("lights") === "true"){
            $("#songs").append(`
              <div class="song">
                  <div class="thumbnail ln-light">
                      <div class="check ln-light" id="yt_ch${tc}">
                          <img src="assets/images/check.png" alt="checkmark" class="img_check">
                      </div>
                  </div>
                  <div class="ln-light s_name">
                      <input type="text" class="song_name txt-light" value="${song.title}">
                  </div>
              </div>
            `);
          }
          else{
            $("#songs").append(`
              <div class="song">
                  <div class="thumbnail ln-dark">
                      <div class="check ln-dark" id="yt_ch${tc}">
                          <img src="assets/images/check.png" alt="checkmark" class="img_check">
                      </div>
                  </div>
                  <div class="ln-dark s_name">
                      <input type="text" class="song_name txt-dark" value="${song.title}">
                  </div>
              </div>
            `);
          }

          $($(".thumbnail")[tc]).css("background", `url(${song.thumbnail}) no-repeat center`);
          tc++;
          songs.push(song.title);
        });
        $("#loading").addClass("hide");
        $("#s2").removeClass("hide");
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
  $("#step").text("Waiting for results");

  if(songs.length >= 1){
    $.ajax({
      url: "/merge_pl",
      type: "POST",
      data: {
        titles: JSON.stringify(songs),
        code: JSON.stringify(window.location.href.split("code=")[1].split("&")[0]),
        public: JSON.stringify($("#pl_check").is(":checked")),
        name: JSON.stringify($("#pl_name").val()),
        desc: JSON.stringify($("#pl_desc").val())
      }
    }).done((response) => {
      $("#loading").addClass("hide");
      $("#step").text("Step 4 - 4 > Results");
      $("#s4").removeClass("hide");
      localStorage.clear();
      alert(String(response.data));
    }).fail((xhr, status, error) => {
      alert(String(status) + "\n" + String(error))
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