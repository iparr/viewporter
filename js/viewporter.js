$(function (w) {
  
  var viewporter = {
    
    MODE_SIZE: "size",
    MODE_URL: "url",
    
    init: function () {
      
      var self = this;
      
      this.subscribe();
      
      this.params = this.getParams();
      
      this.viewport = $('#viewport');
      this.viewportContainer = $('#viewport-container');
      
      this.mainMenu = $('#main-menu');
      
      this.mode = this.MODE_SIZE;
      this.modeButton = $('#mode-btn');
      
      this.shareButton = $('#share-btn');

      this.helpButton = $('#help-btn');
      
      this.flashInfo.init();
      
      this.urlUI.init();
      this.urlModel.init(
        this.getFromParamOrStorage('url')
      );
      
      this.sizeUI.init();
      this.sizeModel.init(
        this.getFromParamOrStorage('width'),
        this.getFromParamOrStorage('height')
      );

      this.presetsUI.init();
      this.presetsModel.init(this.sizeModel);

      this.bindKeyboardShortcuts();

      this.shareButton.on('click', function () {
        
        var qs,
          shareUrl;
        
        if (!window.location.origin) {
          window.location.origin = window.location.protocol + "//" + window.location.host;
        }
          
        qs = '/viewporter/index.html?url=' + encodeURIComponent(self.urlModel.url) +
          (self.sizeModel.width ? ('&width=' + encodeURIComponent(self.sizeModel.width)) : '') +
          (self.sizeModel.height ? ('&height=' + encodeURIComponent(self.sizeModel.height)) : '');
        shareUrl = window.location.origin + qs;
        
        window.prompt('Copy and paste the following URL into your browser', shareUrl);
      });

      this.helpButton.on('click', function () {
        self.showHelp();
      });

      this.modeButton.on('click', function () {
        self.toggleMode();
      });


    },
    getFromParamOrStorage: function (key) {
      var value;
      if (this.params[key]) {
        value = this.params[key];
        console.log("Fetched '" + key + "' from params (" + value + ")");
      } else {
        value = localStorage.getItem(key);
        
        if (!value) {
          value = '';
        }
        
        console.log("Fetched '" + key + "' from local storage (" + value + ")");
      }
      return value;
    },
    subscribe: function () {

      var self = this;

      $.Topic("sizeModel:didResize").subscribe(function (width, height) {
        localStorage.setItem("width", width);
        localStorage.setItem("height", height);
        self.sizeIFrame(width, height);
      });
      
      $.Topic('urlModel:didChangeUrl').subscribe(function (url) {
        localStorage.setItem("url", url);
        self.setUrl(url);
      });
      
      $.Topic("presetsModel:didSelectPreset").subscribe(function (preset) {
        self.sizeWithPreset(preset);
      });
      
      $.Topic("viewporter:toggleFullscreen").subscribe(function () {
        self.mainMenu.toggleClass('hidden');
        self.viewportContainer.toggleClass('fullscreen');
      });
    },
    getParams: function () {
      var params = {}, qs = location.search.substring(1), re = /([^&=]+)=([^&]*)/g, m;
      while (m = re.exec(qs)) {
        params[decodeURIComponent(m[1])] = decodeURIComponent(m[2]);
      }
      return params;
    },
    toggleMode: function () {
      
      var label = this.modeButton.find('.label');
      
      if (this.mode === this.MODE_SIZE) {
        this.mode = this.MODE_URL;
        this.modeButton.removeClass('mode-size').addClass('mode-url');
        label.text("Size");
        $.Topic("viewporter:didChangeToUrlMode").publish();
      } else if (this.mode === this.MODE_URL) {
        this.mode = this.MODE_SIZE;
        this.modeButton.removeClass('mode-url').addClass('mode-size');
        label.text("URL");
        $.Topic("viewporter:didChangeToSizeMode").publish();
      }
    },
    sizeWithPreset: function (preset) {
      this.sizeIFrame(preset.width, preset.height);
    },
    bindKeyboardShortcuts: function () {
      
      var self = this;
      
      /* F: Toggle fullscreen */
      Mousetrap.bind('f', function (e) {
        $.Topic('viewporter:toggleFullscreen').publish();
      });
      
      /* M: Togle mode */
      Mousetrap.bind('m', function () {
        self.toggleMode();
      });

      /* P: Presets */
      Mousetrap.bind('p', function (e) {
        self.presetsUI.toggleActive();
      });
      
      /* Numeric keyboard shortcuts */
      Mousetrap.bind('1', function (e) { self.presetsModel.selectPresetByIndex(0) });
      Mousetrap.bind('2', function (e) { self.presetsModel.selectPresetByIndex(1) });
      Mousetrap.bind('3', function (e) { self.presetsModel.selectPresetByIndex(2) });
      Mousetrap.bind('4', function (e) { self.presetsModel.selectPresetByIndex(3) });
      Mousetrap.bind('5', function (e) { self.presetsModel.selectPresetByIndex(4) });
      Mousetrap.bind('6', function (e) { self.presetsModel.selectPresetByIndex(5) });
      Mousetrap.bind('7', function (e) { self.presetsModel.selectPresetByIndex(6) });
      Mousetrap.bind('8', function (e) { self.presetsModel.selectPresetByIndex(7) });
      Mousetrap.bind('9', function (e) { self.presetsModel.selectPresetByIndex(8) });
    },
    setUrl: function (url) {
      this.viewport.attr('src', url);
    },
    sizeIFrame: function (width, height) {
      this.viewport.width((!width || width === 'Auto') ? '100%' : width);
      this.viewport.height((!height || height === 'Auto') ? '99%' : height);
    },
    showHelp: function () {
      this.urlModel.setUrl('default.html');
    },
  };
  
  viewporter.flashInfo = {
    init: function () {
      this.panel = $('#flash-info');
      this.subscribe();
      this.timeoutId = null;
    },
    subscribe: function () {
      
      var self = this;
      
      $.Topic("viewporter:toggleFullscreen").subscribe(function () {
        self.showMessage("Fullscreen toggled");
      });
      
      $.Topic("sizeModel:didResize").subscribe(function (width, height) {
        self.showMessage("Resized to " + (width ? width : "Auto") + " &times; " + (height ? height : "Auto"));
      });
      
      $.Topic("presetsModel:didSelectPreset").subscribe(function (preset) {
        self.showMessage(preset.name);
      });
      
      $.Topic("viewporter:didChangeToUrlMode").subscribe(function () {
        self.showMessage("URL Mode");
      });
      
      $.Topic("viewporter:didChangeToSizeMode").subscribe(function () {
        self.showMessage("Size Mode");
      });
      
      $.Topic('urlModel:didChangeUrl').subscribe(function (url) {
        self.showMessage(url);
      });
    },
    showMessage: function (message) {
      var self = this;
      self.panel.html(message);
      self.panel.stop(true, true);
      
      if (self.timeoutId) {
        window.clearTimeout(self.timeoutId);
        self.timeoutId = null;
      }
      
      self.panel.css('display', 'block').css('opacity', '100');
      self.timeoutId = window.setTimeout(function () {
        self.panel.fadeOut(500, function () {
          self.panel.css('display', 'none');
          self.timeoutId = null;
        });
      }, 1000);
    }
  };
  
  viewporter.urlModel = {
    init: function (url) {      
      this.setUrl(url || 'http://www.bbc.co.uk/sport/winter-olympics/2014');
      this.subscribe();
    },
    subscribe: function () {
      var self = this;
      $.Topic('urlUI:didChangeUrl').subscribe(function (url) {
        self.setUrl(url);
      });
    },
    setUrl: function (url) {
      this.url = url;
      $.Topic('urlModel:didChangeUrl').publish(url);
    }
  };
  
  viewporter.urlUI = {
    init: function () {
      
      var self = this;
      
      this.menu = $('#url-menu');
      this.urlInput = $('#url-input');
      this.urlButton = $('#url-btn');
      this.active = false;
      
      this.urlButton.on('click', function (e) {
        e.preventDefault();
        self.urlButtonPressed();
      })
      
      this.subscribe();
    },
    subscribe: function () {
      
      var self = this;
      
      $.Topic("viewporter:didChangeToUrlMode").subscribe(function () {
        self.activate();
      });
      
      $.Topic("viewporter:didChangeToSizeMode").subscribe(function () {
        self.deactivate();
      });
      
      $.Topic('urlModel:didChangeUrl').subscribe(function (url) {
        self.setUrl(url);
      });
    },
    setUrl: function (url) {
      
      url = url !== null ? url : '';
      
      if (this.urlInput.val() !== url) {
        this.urlInput.val(url);
      }
    },
    urlButtonPressed: function () {
      $.Topic('urlUI:didChangeUrl').publish(this.urlInput.val());
    },
    toggleActive: function () {
      if (this.active) {
        this.deactivate();
      } else {
        this.activate();
      }
    },
    activate: function () {
      if (!this.active) {
        //this.urlInput.focus();
        this.active = true;
        this.menu.addClass('active');
        $.Topic('urlUI:didActivate').publish();
      }
    },
    deactivate: function () {
      if (this.active) {
        this.active = false;
        this.menu.removeClass('active');
        $.Topic('urlUI:didDeactivate').publish();
      }
    }
  };
  
  viewporter.sizeModel = {
    init: function (width, height) {
      
      var self = this;
      this.setSize(width, height);
      
      self.subscribe();
    },
    subscribe: function () {
      
      var self = this;
      
      $.Topic('sizeUI:resizeButtonPressed').subscribe(function (width, height) {
        self.setSize(width, height);
      });
    },
    setSize: function (width, height) {
      this.width = width;
      this.height = height;
      $.Topic('sizeModel:didResize').publish(this.width, this.height);
    }
  };
  
  viewporter.sizeUI = {
    init: function () {
      
      var self = this;
      
      this.menu = $('#size-menu');

      this.widthInput = $('#size-width-input');
      this.heightInput = $('#size-height-input');
        
      this.resizeButton = $('#resize-btn');
      
      this.resizeButton.on('click', function (e) {
        e.preventDefault();
        self.resizeButtonPressed();
      });

      this.subscribe();
    },
    resizeButtonPressed: function () {
        
      if (this.widthInput.val().toLowerCase() === 'auto') {
        this.widthInput.val('');
      }
      if (this.heightInput.val().toLowerCase() === 'auto') {
        this.heightInput.val('');
      }
        
      $.Topic('sizeUI:resizeButtonPressed').publish(this.widthInput.val(), this.heightInput.val());
    },
    subscribe: function () {
      var self = this;
      
      $.Topic('sizeModel:didResize').subscribe(function (width, height) {
        self.setSize(width, height);
      });
    },
    setSize: function (width, height) {
      this.widthInput.val(width || '');
      this.heightInput.val(height || '');
    },
    toggleActive: function () {
      if (this.active) {
        this.deactivate();
      } else {
        this.activate();
      }
    },
    activate: function () {
      if (!this.active) {
        this.active = true;
        this.menu.addClass('active');
        this.widthInput.focus();
        $.Topic('sizeUI:didActivate').publish();
      }
    },
    deactivate: function () {
      if (this.active) {
        this.active = false;
        this.menu.removeClass('active');
        $.Topic('sizeUI:didDeactivate').publish();
      }
    }
  };
  
  viewporter.presetsModel = {
    init: function (sizeModel) {
      
      var defaultPresets = [
        {
          "id": 1,
          "name": "Tiny Mobile",
          "width": "240px",
          "height": "Auto"
        },
        {
          "id": 2,
          "name": "Smartphone Portrait",
          "width": "320px",
          "height": "Auto"
        },
        {
          "id": 3,
          "name": "Smartphone Landscape",
          "width": "500px",
          "height": "Auto"
        },
        {
          "id": 4,
          "name": "Tablet Landscape",
          "width": "1008px",
          "height": "Auto"
        },
        {
          "id": 5,
          "name": "Desktop",
          "width": "1024px",
          "height": "Auto"
        },
        {
          "id": 6,
          "name": "Wide Desktop",
          "width": "1280px",
          "height": "Auto"
        }
      ],
      presets;
      
      this.sizeModel = sizeModel;
      this.maxPresetId = -1;
      this.presets = [];
      this.presetsById = {};
      this.selectedPreset = null;
      
      /* Fetch from local storage */
      if (localStorage.getItem("presets") !== null) {
        this.presets = JSON.parse(localStorage.getItem("presets"));
      }
      /* Retrieve from local storage */
      else {
        this.presets = defaultPresets;
        this.save();
      }
      
      this.initPresets();
      
      this.subscribe();
    },
    subscribe: function () {
      
      var self = this;
      
      $.Topic("presetsUI:saveCurrentAsPreset").subscribe(function () {
        self.addNewPreset(self.sizeModel.width, self.sizeModel.height);
      });
      
      $.Topic('presetUI:selectPreset').subscribe(function (presetId) {
        self.selectPreset(self.presetsById[presetId]);
      });
      
      $.Topic('presetUI:deletePreset').subscribe(function (presetId) {
        self.deletePreset(self.presetsById[presetId]);
      });
      
      $.Topic('presetUI:moveUpPreset').subscribe(function (presetId) {
        self.movePresetUp(self.presetsById[presetId]);
      });
      
      $.Topic('presetUI:moveDownPreset').subscribe(function (presetId) {
        self.movePresetDown(self.presetsById[presetId]);
      });
      
      $.Topic('presetUI:changePresetName').subscribe(function (presetId, name) {
        self.changePresetName(self.presetsById[presetId], name);
      });
    },
    initPresets: function () {
      var len = this.presets.length,
        preset,
        i;

      /* sortedPresets = presets.slice();
         sortedPresets.sort(this.sortByOrder); */
      
      for (i = 0; i < len; i++) {
        preset = this.presets[i];
        
        if (preset.id > this.maxPresetId) {
          this.maxPresetId = preset.id;
        }
        
        this.presetsById[preset.id] = preset;
        $.Topic("presetsModel:didAppendPreset").publish(preset);
      }
    },
    save: function () {
      localStorage.setItem("presets", JSON.stringify(this.presets));
    },
    nextPresetId: function () {
      return ++this.maxPresetId;
    },
    addNewPreset: function (width, height) {
      
      var presetId = this.nextPresetId(),
        preset = {
          "id": presetId,
          "name": "New preset #" + presetId,
          "width": width ? width : "Auto",
          "height": height ? height : "Auto"
        };
      
        this.presets.push(preset);
        this.presetsById[preset.id] = preset;
        $.Topic("presetsModel:didAppendPreset").publish(preset);
        this.selectPreset(preset);
        this.save();
    },
    deselectSelectedPreset: function () {
      this.selectPreset(null);
    },
    selectPresetByIndex: function (presetIndex) {
      if (presetIndex < this.presets.length) {
        this.selectPreset(this.presets[presetIndex]);
      }
    },
    selectPreset: function (preset) {
      
      var deselectedPreset = this.selectedPreset;
      this.selectedPreset = preset;
      
      if (deselectedPreset !== null) {
        $.Topic("presetsModel:didDeselectPreset").publish(deselectedPreset);
      }
      
      if (preset !== null) {
        $.Topic("presetsModel:didSelectPreset").publish(this.selectedPreset);
      }
    },
    changePresetName: function (preset, name) {
      preset.name = name;
      this.save();
      $.Topic("presetsModel:didChangePresetName").publish(preset);
    },
    movePresetUp: function (preset) {
      var index = this.presets.indexOf(preset),
        presetToSwap;
      if (index > 0) {
        presetToSwap = this.presets[index - 1];
        this.presets[index - 1] = preset;
        this.presets[index] = presetToSwap;
        this.save();
        $.Topic("presetsModel:didSwapPresets").publish(preset, presetToSwap);
      }
    },
    movePresetDown: function (preset) {
      var index = this.presets.indexOf(preset),
        presetToSwap;
      if (index < this.presets.length - 1) {
        presetToSwap = this.presets[index + 1];
        this.presets[index + 1] = preset;
        this.presets[index] = presetToSwap;
        this.save();
        $.Topic("presetsModel:didSwapPresets").publish(presetToSwap, preset);
      }
    },
    deletePreset: function (preset) {      
      var index = this.presets.indexOf(preset);
      this.presets.splice(index, 1);
      delete this.presetsById[preset.id];
      this.save();
      $.Topic('presetModel:didDeletePreset').publish(preset);
    },
    sortById: function (a, b) {
      return ((a.id < b.id) ? -1 : ((a.id > b.id) ? 1 : 0));
    },
    sortByOrder: function (a, b) {
      return ((a.order < b.order) ? -1 : ((a.order > b.order) ? 1 : 0));
    },
    sortByName: function (a, b) {
      return a.name.localeCompare(b.name);
    }
  };
  
  viewporter.presetsUI = {
    init: function () {
      
      var self = this;
      
      this.MAX_NUM_PRESETS = 9;
      
      this.activateToggle = $('#presets-btn');
      this.panel = $('#presets-panel');
      this.editToggle = $('#presets-edit-btn');
      this.saveButton = $('#save-current-as-preset-btn');
      this.table = $('#presets-table');
      this.active = false;
      this.editing = false;
      
      this.activateToggle.on('click', function (e) {
        e.preventDefault();
        self.toggleActive();
      });
      
      this.editToggle.on('click', function (e) {
        e.preventDefault();
        self.toggleEdit();
      });
      
      this.saveButton.on('click', function (e) {
        e.preventDefault();
        $.Topic("presetsUI:saveCurrentAsPreset").publish();
      });
      
      this.subscribe();
    },
    subscribe: function () {
      
      var self = this;
      
      $.Topic("presetsModel:didSelectPreset").subscribe(function (preset) {
        self.selectPreset(preset);
      });
      
      $.Topic("presetsModel:didDeselectPreset").subscribe(function (preset) {
        self.deselectPreset(preset);
      });
      
      $.Topic("presetsModel:didAppendPreset").subscribe(function (preset) {
        self.appendPreset(preset);
      });
      
      $.Topic('viewporter:toggleFullscreen').subscribe(function () {
        self.toggleHidden();
      });
      
      $.Topic('sizeUI:didDeactivate').subscribe(function () {
        self.disableEditing();
        self.deactivate();
      });
      
      $.Topic('presetModel:didDeletePreset').subscribe(function (preset) {
        self.deletePreset(preset);
      });
      
      $.Topic("presetsModel:didSwapPresets").subscribe(function (preset, presetToSwap) {
        self.swapPresets(preset, presetToSwap);
      });
    },
    getPresetRowById: function (presetId) {
      return this.table.find('[data-id="' + presetId + '"]')
    },
    selectPreset: function (preset) {
      var $row = this.getPresetRowById(preset.id);
      $row.addClass('selected');
    },
    deselectPreset: function (preset) {
      var $row = this.getPresetRowById(preset.id);
      $row.removeClass('selected');
    },
    appendPreset: function (preset) {
      var self = this,
        row = this.rowHtml(preset);
        
      this.table.find('tbody:last').append(row);
      
      this.updateSaveButton();
      
      $row = this.getPresetRowById(preset.id);
      
      $row.on('click', function (e) {
        if (!self.editing) {
          e.preventDefault();
          $.Topic('presetUI:selectPreset').publish(preset.id);
        }
      });
      
      $row.find('.delete-btn').on('click', function (e) {
        e.preventDefault();
        $.Topic('presetUI:deletePreset').publish(preset.id);
      });
      
      $row.find('.move-up-btn').on('click', function (e) {
        e.preventDefault();
        $.Topic('presetUI:moveUpPreset').publish(preset.id);
      });
      
      $row.find('.move-down-btn').on('click', function (e) {
        e.preventDefault();
        $.Topic('presetUI:moveDownPreset').publish(preset.id);
      });
    },
    deletePreset: function (preset) {
      $row = this.getPresetRowById(preset.id);
      $row.remove();
      this.updateSaveButton();
    },
    swapPresets: function (presetA, presetB) {
      var row1 = this.getPresetRowById(presetA.id),
        row2 = this.getPresetRowById(presetB.id);
        row1.after(row2);
    },
    updateSaveButton: function () {
      if (this.table.find('.preset-row').length >= this.MAX_NUM_PRESETS) {
        this.saveButton.hide();
      } else {
        this.saveButton.show();
      }
    },
    rowHtml: function (preset) {
      
      /* NOTE: Preset properties must not contain special characters */
      
      var name = preset.name.replace(/"/g , "&#34;"),
        row = '\
        <tr class="preset-row" data-id="' + preset.id + '">\
          <td class="col-name">\
            <div class="name">\
              <span class="label">' + name + '</span>\
              <input class="menu-item text-input" type="text" value="' + name + '" />\
            </div>\
          </td>\
          <td>' + preset.width + ' &times; ' + preset.height + '</td>\
          <td class="col-kb"></td>\
          <td class="col-delete">\
            <a href="#" class="cell-btn delete-btn">\
              <span class="icon" title="Delete">Delete</span>\
            </a>\
          </td>\
          <td class="col-move">\
            <a href="#" class="cell-btn move-up-btn">\
              <span class="icon" title="Move up">Move up</span>\
            </a><a href="#" class="cell-btn move-down-btn">\
              <span class="icon" title="Move down">Move down</span>\
            </a>\
          </td>\
        </tr>';
        
      return row;
    },
    toggleHidden: function () {
      if (this.active) {
        if (this.hidden) {
          this.hidden = false;
          this.panel.show();
        } else {
          this.hidden = true;
          this.panel.hide();
        }
      }
    },
    toggleActive: function () {
      if (this.active) {
        this.deactivate();
      } else {
        this.activate();
      }
    },
    activate: function () {
      this.active = true;
      this.activateToggle.addClass('active');
      this.panel.fadeIn(250);
    },
    deactivate: function () {
      this.active = false;
      this.activateToggle.removeClass('active');
      this.panel.hide();
    },
    toggleEdit: function () {
      
      var self = this,
        rowInput,
        rowLabel,
        rowInputText,
        presetId;
      
      if (this.editing) {
        
        /* Check for changes */
        $.each(this.table.find('.preset-row'), function (index, row) {
          
          var $row = $(row);
          
          rowInput = $row.find('.col-name .text-input');
          rowLabel = $row.find('.col-name .label');
          rowInputText = rowInput.val().trim();
          
          if (rowInputText !== rowLabel.text()) {
            rowLabel.text(rowInputText);
            presetId = $row.data('id');
            $.Topic('presetUI:changePresetName').publish(presetId, rowInputText);
          }
        })
        
        this.disableEditing();
      } else {
        this.enableEditing();
      }
    },
    enableEditing: function () {
      if (!this.editing) {
        this.editing = true;
        this.editToggle.addClass('active');
        this.editToggle.find('.label').text('Done');
        this.panel.addClass('edit-enabled').removeClass('edit-disabled');
      }
    },
    disableEditing: function () {
      if (this.editing) {        
        this.editing = false;
        this.editToggle.removeClass('active');
        this.editToggle.find('.label').text('Edit');
        this.panel.addClass('edit-disabled').removeClass('edit-enabled');
      }
    }
  };
  
  $(function () {
    viewporter.init();
  });
  
}(this));