# Youtube to Spotify

Youtube to spotify is a "summer project", made just for fun and it is currently hosted in the [heroku app](https://www.heroku.com/), therefore since it is in the free plan it is currently sleeping [^1] between 02:00 AM (GMT) and 08:00 (GMT), and the rest of the time it's using [kaffeine](https://kaffeine.herokuapp.com/) so it never goes to sleep.

You can access this app [here](https://yt-sp.herokuapp.com/)

### Technologies used:
- [NodeJS](https://nodejs.org/en/)
- [JavaScript](https://developer.mozilla.org/en-US/docs/Web/JavaScript)
- [Jquery](https://jquery.com/)
- [CSS](https://developer.mozilla.org/en-US/docs/Web/CSS)
- [HTML5](https://developer.mozilla.org/en-US/docs/Web/html)


### Frameworks used:
- [Axios](https://github.com/axios/axios)
- [Express](https://expressjs.com/)
- [NodeJS base64 converter](https://www.npmjs.com/package/nodejs-base64-converter)
- [Nodemon](https://www.npmjs.com/package/nodemon)
- [Spotify web API](https://www.npmjs.com/package/spotify-web-api-node)


### How to use the app:
1. Go to the [app](https://yt-sp.herokuapp.com/) 
2. Insert an youtube URL from a playlist (it has to be either public or unlisted)
3. Login to your spotify account
4. Choose the songs you  want to add to your playlist or change the name to try and keep a format of (song name - artist | artist - song name) (this is currently disable, so just click on next)
5. Give your playlist a name (required) and a description (not required)
6. Wait while the app searches the Spotify API for the songs in your youtube playlist
7. When done, you'll see 1 of 2 possible results:
	- "All songs were found and added to the spotify playlist!"
	- "We couldn't find X songs in a total of Y songs (Z%)" (And a list with the NOT found songs)


### An important note:
- The youtube to spotify app does NOT store any data about your spotify account and what songs are being searched or what songs you listen to.


### To improve:
- The way the app searches for the songs with the spotify API could be a little better, but it's working OK.
- Performance wise I think it's pretty good, but for sure there's somewhere where it can get a bit better.










[^1]: Sleeping means that when someone goes to the [app](https://yt-sp.herokuapp.com), it might take up to 30 seconds to respond, that's where [kaffeine](https://kaffeine.herokuapp.com/) makes the difference, since it pings the app every 30 minutes so it will never sleep.