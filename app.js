/**
 * Module dependencies.
 */
var express = require('express')
  , http = require('http')
  , path = require('path');

var app = express();

// Configure expresss environments.
app.set('port', process.env.PORT || 3000);
app.set('views', __dirname + '/views');
app.set('view engine', 'jade');
app.use(express.favicon());
app.use(express.logger('dev'));
app.use(express.bodyParser());
app.use(express.methodOverride());
app.use(app.router);
app.use(require('stylus').middleware(__dirname + '/public'));
app.use(express.static(path.join(__dirname, 'public')));

// Set any view options.
// NOTE: I don't like this way of doing this.
var appUrl = '//' + (process.env.URL || 'localhost');

// Development only.
if ('development' == app.get('env')) {
  app.use(express.static(path.join(__dirname, 'test')));
  app.use(express.errorHandler());

  appUrl += ':' + app.get('port');

  app.get('/app.xml', function(request, response){
    response.render('app_core', { appUrl: appUrl });
  });
}
// Production only.
else {
  app.get('/app.xml', function(request, response){
    response.header('Content-Type', 'application/xml');
    response.render('app_core', { appUrl: appUrl }, function(err, html){
      response.render('app_xml_wrapper', { content: html });
    });
  });
}

http.createServer(app).listen(app.get('port'), function(){
  console.log('Express server listening on port ' + app.get('port'));
});
