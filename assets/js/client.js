$("#form_yt").on("submit", (e) => {
    e.preventDefault();

    $.ajax({
        url: '/load_yt_playlist',
        type:'POST',
        data: $("#form_yt").serialize()
      })
      .done(response => {
        response["data"].forEach(song => {
          $("#yt_songs").append(`<li class='song'>${song}</li>`)
        });
      });
})