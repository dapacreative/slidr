;(function($, window, document) {

  "use strict";

  // Create the defaults once
  var pluginName = "slidr",
    defaults = {
      mode: "fade",
      speed: 500,
      slideDuration: 4000,
      easing: 'ease',
      start: 1,
      pauseOnHover: true,
      pagination: {
        active: true,
        location: 'bottom'
      },
      navigation: {
        active: true
      },
      responsive: true
    };

  // The actual plugin constructor
  function Plugin(elem, options) {
    this.elem = elem;
    this.$elem = $(elem);
    this.settings = $.extend({}, defaults, options);
    this._defaults = defaults;
    this._name = pluginName;
    this.init();
  }

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
        direction: 'left',
        animating: false
      }
    },
    
    init: function() {
      // Test for CSS transitions
      this.cssTransitionTest();

      // Create a container around slider
      this.wrapElem();

      // Cache Dom elements
      this.cacheDom();

      // Setup
      this.setup = this.setup();

      // Set dimensions for slider
      this.setDimensions(this.setup.containers, this.setup.dimensions);

      // Build pagination and navigation
      this.build();

      // If initialized start slider
      if(this.setup.initialized) this.start();

      // Bind Events
      this.bindEvents();
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

      if(this.settings.navigation.active) {
        this.$next.on('click', {direction:'right'}, this.changeSlide.bind(this));
        this.$prev.on('click', {direction:'left'}, this.changeSlide.bind(this));
      }

      if(this.settings.pagination.active) this.$pagination.find('li').on('click', this.changeSlide.bind(this));

      if(this.settings.pauseOnHover) {
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

    changeSlide: function(event) {
      //Prevent Clicking if animation is in progres
      if (this.setup.animating) return;    

      //Set Direction
      this.direction(event);

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
          this.setup.direction = event.data.direction;
        } else {
          var index = $(event.currentTarget).data('item');

          if (index < this.setup.currentSlide) {
            this.setup.direction = 'left';
          } else if (index > this.setup.currentSlide) {
            this.setup.direction = 'right';
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
        this.setup.animating = true;
      }.bind(this),100);

      setTimeout(function(){
        this.$elem.removeClass('animating');
        this.removeTransitionSettings(next);  
        this.setCurrentSlide(this.setup.currentSlide);
        current.attr('class','');
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

      if(location === 'bottom') {
        this.$container.after(pagination);
        this.$pagination = this.$container.next('.slidr-pagination');
      } else if (location === 'top') {
        this.$container.before(pagination);
        this.$pagination = this.$container.prev('.slidr-pagination');
      }
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
    }

  });

  // A really lightweight plugin wrapper around the constructor,
  // preventing against multiple instantiations
  $.fn[pluginName] = function(options) {
    return this.each(function() {
      if (!$.data(this, "plugin_" + pluginName)) {
        $.data(this, "plugin_" + pluginName, new Plugin(this, options));
      }
    });
  };

})(jQuery, window, document);