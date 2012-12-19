(function () { 
  // reload the page was loaded more than 5s ago
  var loc = window.location;
  if (loc.search.indexOf('?t=') != -1 && Date.now() - loc.search.replace('?t=', '') > 5000) {
    loc.href = loc.origin + loc.pathname + '?t=' + Date.now();
    return;
  }

  var $scroll = document.getElementsByClassName('mScroll')[0];
  var grids = {};
  var scroll = new mScroll($scroll, {
    onRenderPage: function (page, pageNo) {
      var grid = document.createElement('div');
      grid.className = 'mGrid'; 

      for (var j = 0; j < 20; ++j) {
        grid.innerHTML += '<div class="entry-frame"><img src="imgs/' + (+pageNo + 6) + '.jpeg" width="100%" /></div>'; 
      }

      page.appendChild(grid);
      grids[pageNo] = new mGrid(grid, {});
    },

    onDisposePage: function (pageNo) {
      grids[pageNo].destroy();
      delete grids[pageNo];
    }
  }); 

  /**
   * WARNING!!!
   * plz watch out on how u fill mScroll if u concatenate html u need to
   * create mGrid object in separate loop because 
   * element.innerHTML += '...' something will create new instances 
   * of previous added content so everything will be broken.
   */
}());


