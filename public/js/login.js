$(document).ready( function() {
    
    var btnTwitchLogin = $('.twitch-connect');
    btnTwitchLogin.click(function() {
        Twitch.login({
            scope: ['user_read', 'channel_read']
        });
    });
     
    Twitch.init({
      clientId: 'YOUR_CLIENT_ID_HERE',
      session: status,
      nw: guiTwitch
    }, function(error, status) {
      if (error) {
          console.log(error);
      }
      if (status.authenticated) {
          console.log('SYS: User is authenticated. ' + status); 
      }
    });
});