;(function($, window, document) {

  "use strict";
  
  /**
   * ===================================================================================
   * = Plugin Defaults
   * ===================================================================================
   */

  var pluginName = "slidr",
    defaults = {
      mode: "fade",
      speed: 500,
      slideDuration: 0,
      easing: 'ease',
      start: 1,
      pauseOnHover: true,
      pagination: {
        active: true,
        location: 'bottom',
        showOnHover: false
      },
      navigation: {
        active: true,
        showOnHover: false
      },
      touchEnabled: true,
      swipeThreshold: 50,
      responsive: true
    };
  
  /**
   * ===================================================================================
   * = Plugin Constructor
   * ===================================================================================
   */

  function Plugin(elem, options) {
    this.elem = elem;
    this.$elem = $(elem);
    this.settings = $.extend({}, defaults, options);
    this._defaults = defaults;
    this._name = pluginName;
    init(this);
  }

  /**
   * ===================================================================================
   * = Private Functions
   * ===================================================================================
   */

  var init = function(plugin) {
    // Test for CSS transitions
    plugin.cssTransitionTest();

    // Create a container around slider
    plugin.wrapElem();

    // Cache Dom elements
    plugin.cacheDom();

    // Setup
    plugin.setup = plugin.setup();

    // Set dimensions for slider
    plugin.setDimensions(plugin.setup.containers, plugin.setup.dimensions);

    // Build pagination and navigation
    plugin.build();

    // If initialized start slider
    if(plugin.setup.initialized) plugin.start();

    // Bind Events
    plugin.bindEvents();

    // Init Touch 
    if(plugin.settings.touchEnabled) plugin.initTouch();
  }

  /**
   * ===================================================================================
   * = Public Methods
   * ===================================================================================
   */

  // Avoid Plugin.prototype conflicts
  $.extend(Plugin.prototype, {

    setup: function() {
      return {
        dimensions: this.getDimensions(),
        containers: [this.$elem],
        slideCount: this.$slides.length,
        initialized: false,
        currentSlide: this.settings.start - 1,
        nextSlide: 0,
        direction: 'right',
        animating: false
      }
    },
    
    cacheDom: function() {
      this.$slides = this.$elem.children();
      this.$container = this.$elem.parent();
    },

    wrapElem: function() {
      this.$elem.wrap('<div class="slidr-container"></div>');
    },

    bindEvents: function() {
      $(window).on('resize', function() {
        this.setup.dimensions = this.getDimensions();
        this.setDimensions(this.setup.containers, this.setup.dimensions);
      }.bind(this));

      if (this.settings.navigation.active) {
        this.$next.on('click swipe-right', {direction:'right'}, this.changeSlide.bind(this));
        this.$prev.on('click swipe-left', {direction:'left'}, this.changeSlide.bind(this));
      }

      if (this.settings.pagination.active) this.$pagination.find('li').on('click', this.changeSlide.bind(this));

      if (this.settings.pauseOnHover) {
        this.$elem.hover(this.stopAutoPlay.bind(this), this.startAutoPlay.bind(this));
      }
    },

    start: function() {
      this.$container.addClass('init');
      this.setCurrentSlide(this.setup.currentSlide);
      if(this.settings.pagination.active) this.setCurrentPagination(this.setup.currentSlide);
      this.startAutoPlay();
    },

    cssTransitionTest: function() {
      var elem = document.createElement('modernizr');
      //A list of properties to test for
      var props = ["transition","WebkitTransition","MozTransition","OTransition","msTransition"];
      //Iterate through our new element's Style property to see if these properties exist
      for ( var i in props ) {
        var prop = props[i];
        var result = elem.style[prop] !== undefined ? prop : false;
        if (result){
          this.csstransitions = result;
          break;
        } 
      }
    },

    build: function() {
      if(this.settings.navigation.active) {
        this.createNavigation(this.settings.pagination.location);
      }
      if(this.settings.pagination.active) {
        this.createPagination(this.settings.pagination.location);
      }
      this.setup.initialized = true;
    },

    initAutoPlay: function() {
      this.timer = setInterval(function(){
        this.changeSlide();
      }.bind(this), this.settings.slideDuration + this.settings.speed);
    },

    startAutoPlay: function() {
      if (this.settings.slideDuration === 0) return;
      
      this.initAutoPlay();
    },

    stopAutoPlay: function() {
      if (this.timer) clearInterval(this.timer);
    },

    changeSlide: function(event, direction) {
      //Prevent Clicking if animation is in progres
      if (this.setup.animating) return;

      // Init animating setting
      this.setup.animating = true;

      //Reset Autoplay Timer
      this.stopAutoPlay();    

      //Set Direction
      this.setup.direction = (direction !== undefined) ? direction : this.direction(event);

      //Set Next Slide and proceed to animate if true
      var animate = this.next(event);
      if (!animate) return;

      //Animate Slide and Update Current Slide
      this.animateSlide(this.setup, this.settings);
    },

    direction: function(event) {  
      if (typeof event !== 'undefined') {
        //Triggered by event
        if (typeof event.data !== 'undefined') {
          return event.data.direction;
        } else {
          var index = $(event.currentTarget).data('item');

          if (index < this.setup.currentSlide) {
            return 'left';
          } else if (index > this.setup.currentSlide) {
            return 'right';
          }
        }
      } else {
        //Autoplay
        this.setup.direction = 'right';
      }
    },

    next: function(event) {
      var slideCount = (this.setup.slideCount - 1),
          index = undefined;

      //Triggered by event
      if (typeof event !== 'undefined') {
        index = (typeof event.data === 'undefined') ? $(event.currentTarget).data('item') : undefined;
      }

      //If Pagination
      if (index !== undefined) { 
        if(index !== this.setup.currentSlide) {
          //If not current slide
          this.setup.nextSlide = $(event.currentTarget).data('item'); 
        } else {
          //If current slide
          return;
        }
      }

      //If Navigation
      if (index === undefined) {
        switch (true) {
          //If prev and not first
          case (this.setup.direction === 'left' && this.setup.currentSlide > 0):
            this.setup.nextSlide = this.setup.currentSlide - 1;
            break;
          //If prev and first
          case (this.setup.direction === 'left' && this.setup.currentSlide === 0):
            this.setup.nextSlide = slideCount;
            break;
          //If next and not last
          case (this.setup.direction === 'right' && this.setup.currentSlide < slideCount):
            this.setup.nextSlide = this.setup.currentSlide + 1;
            break;
          //If next and last
          case (this.setup.direction === 'right' && this.setup.currentSlide === slideCount):
            this.setup.nextSlide = 0;
            break;
        }
      }

      return true;        
    },

    animateSlide: function(options) {
      var $current = this.$slides.eq(options.currentSlide),
          $next = this.$slides.eq(options.nextSlide);

      switch(this.settings.mode) {
        case 'fade':
          $next.addClass('fade');
          this.cssTransition($next, $current);
          break;
        case 'wipe':
          $next.addClass('wipe ' + options.direction);
          this.cssTransition($next, $current);
          break;
        case 'wipe-out':
          $current.addClass('wipe-out ' + options.direction);
          $next.addClass('behind');
          this.cssTransition($next, $current);
          break;
        case 'scale':
          $next.addClass('scale');
          this.cssTransition($next, $current);
          break;
        case 'horizontal':
          $current.addClass('horizontal ' + options.direction);
          $next.addClass('wipe ' + options.direction);
          this.cssTransition($next, $current);
          break;
        case 'vertical':
          $current.addClass('vertical ' + options.direction);
          $next.addClass('vertical-next ' + options.direction);
          this.cssTransition($next, $current);
          break;
        default: 
          $next.addClass('fade');
          this.cssTransition($next, $current);
      }

      this.setup.currentSlide = this.setup.nextSlide;
      if(this.settings.pagination.active) this.setCurrentPagination(this.setup.currentSlide); 
    },

    cssTransition: function(next, current) {
      setTimeout(function(){
        this.addTransitionSettings(next);
        this.$elem.addClass('animating');   
      }.bind(this),100);

      setTimeout(function(){
        this.$elem.removeClass('animating');
        this.removeTransitionSettings(next);  
        this.setCurrentSlide(this.setup.currentSlide);
        current.attr('class','');
        this.startAutoPlay();
        // Remove animating setting
        this.setup.animating = false;
      }.bind(this),100 + this.settings.speed);
    },

    addTransitionSettings: function(elem){
      var _ = this;
      this.$slides.each(function(){
        this.style[_.csstransitions+'Duration'] = _.settings.speed + 'ms';
        this.style[_.csstransitions+'TimingFunction'] = _.settings.easing;
      });
    },

    removeTransitionSettings: function(elem){
      var _ = this;
      this.$slides.each(function(){
        this.style[_.csstransitions+'Duration'] = '';
        this.style[_.csstransitions+'TimingFunction'] = '';
      });
    },

    getDimensions: function() {
      var dimensions = {
        elemHeight: this.$container.outerHeight(),
        elemWidth: this.$container.outerWidth(), 
        slideHeight: this.$slides.outerHeight(),
        slideWidth: this.$slides.outerWidth(),
        slideRatio: this.$slides.outerHeight()/this.$slides.outerWidth()
      };

      return dimensions;
    },

    setDimensions: function(elems, dimensions) {
      for (var i =  0; i < elems.length; i++) {
        elems[i].css({
          "width" : (this.settings.responsive) ? dimensions.elemWidth : dimensions.slideWidth,
          "height" : (this.settings.responsive) ? dimensions.elemWidth*dimensions.slideRatio : dimensions.slideHeight
        });
      };
    },

    setCurrentSlide: function(index) {
      this.$slides.removeClass('active');
      this.$slides.eq(index).attr('class', 'active');
    },

    setCurrentPagination: function(index) {
      this.$pagination.find('li').removeClass('active');
      this.$pagination.find('li').eq(index).addClass('active');
    },

    createPagination: function(location) {
      var pagination = '<ul class="slidr-pagination">';
      for (var i = 0; i < this.setup.slideCount; i++) {
        pagination += '<li data-item="'+i+'">'+(i)+'</li>';
      };
      pagination += '</ul>';

      switch (location) {
        case 'bottom':
          this.$elem.after(pagination);
          this.$pagination = this.$elem.next('.slidr-pagination');
          break;
        case 'top':
          this.$elem.before(pagination);
          this.$pagination = this.$elem.prev('.slidr-pagination');
          break;
        case 'over':
          this.$elem.after(pagination);
          this.$pagination = this.$elem.next('.slidr-pagination');
          this.$pagination.addClass('over');
          break;
        default: 
          this.$elem.after(pagination);
          this.$pagination = this.$elem.next('.slidr-pagination');
          this.$pagination.addClass('over');
          break;
      }

      if (this.settings.pagination.showOnHover) this.hidePagination();
    },

    hidePagination: function() {
      this.$pagination.addClass('hide');
    },

    createNavigation: function() {
      var navigation = '<ul class="slidr-navigation">';
          navigation += '<li class="slidr-prev">Prev</li>';
          navigation += '<li class="slidr-next">Next</li>';
          navigation += '</ul>';
      this.$elem.after(navigation);

      this.$navigation = this.$container.find('.slidr-navigation');
      this.$next = this.$navigation.find('.slidr-next');
      this.$prev = this.$navigation.find('.slidr-prev');

      if (this.settings.navigation.showOnHover) this.hideNavigation();
    },

    hideNavigation: function() {
      this.$navigation.find('li').addClass('hide');
    },

    initTouch: function() {
      this.touch = {
        start: {x: 0, y: 0},
        end: {x: 0, y: 0}
      };
      this.$elem.on('touchstart.slidr', this.onTouchStart.bind(this));
    },

    onTouchStart: function(event) {
      if (this.setup.animating) return;

      // Record the starting touch x, y coordinates.
      this.touch.start.x = event.originalEvent.changedTouches[0].pageX;
      this.touch.start.y = event.originalEvent.changedTouches[0].pageY;
      
      // Bind a "touchmove" event to the slider.
      this.$elem.on('touchmove.slidr', this.onTouchMove.bind(this));
      // Bind a "touchend" event to the slider.
      this.$elem.on('touchend.slidr', this.onTouchEnd.bind(this));
    },

    onTouchMove: function(event) {
      var x_movement = Math.abs(event.originalEvent.changedTouches[0].pageX - this.touch.start.x),
          y_movement = Math.abs(event.originalEvent.changedTouches[0].pageY - this.touch.start.y),
          change = event.originalEvent.changedTouches[0].pageX - this.touch.start.x;

      if ((x_movement * 3) > y_movement) return;
    },

    onTouchEnd: function(event) {
      //Unbind "touchmove"
      this.$elem.off('touchmove.slidr');

      // Record end x, y positions.
      this.touch.end.x = event.originalEvent.changedTouches[0].pageX;
      this.touch.end.y = event.originalEvent.changedTouches[0].pageY;

      // Calculate distance and el's animate property.
      var distance = this.touch.end.x - this.touch.start.x,
          leftSwipe = distance < 0,
          direction = 'left';

      if (Math.abs(distance) < this.settings.swipeThreshold) return;

      if (leftSwipe) {
        this.changeSlide(event, direction)
      } else {
        direction = 'right';
        this.changeSlide(event, direction);
      }

      this.$elem.off('touchend.slidr');
    }

  });


  /**
   * ===================================================================================
   * = Plugin Wrapper around Constructuro
   * ===================================================================================
   */

  $.fn[pluginName] = function(options) {
    var plugin;
    this.each(function() {
      plugin = $.data(this, 'plugin_' + pluginName);
      if (!plugin) {
        plugin = new Plugin(this, options);
        $.data(this, 'plugin_' + pluginName, plugin);
      }
    });
    return plugin;
  };

})(jQuery, window, document);