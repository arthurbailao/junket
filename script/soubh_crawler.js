var casper = require('casper').create({
  pageSettings: {
    loadImages:  false,        // do not load images
    loadPlugins: false         // do not load NPAPI plugins (Flash, Silverlight, ...)
  },
  verbose: true,
  logLevel: "debug"
});

var fs = require('fs'); 

casper.on('remote.message', function(message) {
  console.log(message);
});

var result = {
  'data': []
}

var selectors = {
  'box': '.complete-list>li',
  'title': '.title',
  'address': '.endereco',
  'description': '.desc',
  'next': '.plusPagerNext'
}

var home_urls = ['http://www.soubh.com.br/casas-noturnas', 'http://www.soubh.com.br/bares',
                 'http://www.soubh.com.br/restaurantes', 'http://www.soubh.com.br/lanches'];

var scrape = function(selectors) {
  var data = [];
  jQuery(selectors.box).each(function(){
    data.push({
      'title': jQuery(selectors.title, this).text().trim(),
      'address': jQuery(selectors.address, this).text().trim(),
      'description': jQuery(selectors.description, this).text().trim()
    });
  });
  console.log(JSON.stringify(data));
  return data;
}

var terminate = function() {
  this.echo("that's all, folks.");
};

var process_page = function() {
  this.then(function(){  
    var data = this.evaluate(scrape, selectors);
    for(var i = 0; i < data.length; i++) {
      var filtered = result.data.filter(function(item){
        return (item.title == data[i].title);
      });
      if(filtered.length == 0) result.data.push(data[i]);
    }
    if(this.exists(selectors.next)) {
      var url = this.getCurrentUrl();
      this.thenClick(selectors.next).then(function(){
        this.waitFor(function() {
          return url !== this.getCurrentUrl();
        }, process_page, terminate);
      });
    } else {
      return terminate.call(casper);
    }
  });
}

casper.start().eachThen(home_urls, function(response){
  this.thenOpen(response.data, function(){
    if(this.exists(selectors.next)) {
      this.waitForSelector(selectors.next, process_page, terminate);
    } else {
      return terminate.call(casper);
    }
  });
});

casper.run(function(){
  fs.write('output.json', JSON.stringify(result));
  this.echo("Items found: " + result.data.length).exit();   
});