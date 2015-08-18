;(function($, window, document) {

  "use strict";

  // Create the defaults once
  var pluginName = "slidr",
    defaults = {
      mode: "fade",
      speed: 500,
      transitionSpeed: 500,
      easing: 'ease',
      start: 1,
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
      if(this.settings.pagination.active) this.$pagination.find('a').on('click', this.changeSlide.bind(this));
    },

    start: function() {
      this.$container.addClass('init');
      this.setCurrentSlide(this.setup.currentSlide);
      if(this.settings.pagination.active) this.setCurrentPagination(this.setup.currentSlide);
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

    changeSlide: function(event) {
      //Prevent Default
      event.preventDefault();

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
      var index = $(event.currentTarget).data('item');

      if (typeof event.data !== 'undefined') {
        this.setup.direction = event.data.direction;
      } else {
        if (index < this.setup.currentSlide) {
          this.setup.direction = 'left';
        } else if (index > this.setup.currentSlide) {
          this.setup.direction = 'right';
        }
      }
    },

    next: function(event) {
      var index = (typeof event.data === 'undefined') ? $(event.currentTarget).data('item') : undefined,
          slideCount = (this.setup.slideCount - 1);

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
          this.transition($next, $current);
          break;
        case 'wipe':
          $next.addClass('wipe ' + options.direction);
          this.transition($next, $current);
          break;
        case 'horizontal':
          $current.addClass('horizontal ' + options.direction);
          $next.addClass('wipe ' + options.direction);
          this.transition($next, $current);
          break;
        case 'vertical':
          $current.addClass('vertical ' + options.direction);
          $next.addClass('vertical-next ' + options.direction);
          this.transition($next, $current);
          break;
        default: 
          $next.addClass('fade');
          this.transition($next, $current);
      }

      this.setup.currentSlide = this.setup.nextSlide;
      if(this.settings.pagination.active) this.setCurrentPagination(this.setup.currentSlide); 
    },

    transition: function(next, current) {
      setTimeout(function(){
        //this.addTransitionSettings(elem);
        this.$elem.addClass('animating');   
        this.setup.animating = true;
      }.bind(this),100);

      setTimeout(function(){
        this.$elem.removeClass('animating');
        //this.removeTransitionSettings(elem);  
        this.setCurrentSlide(this.setup.currentSlide);
        current.attr('class','');
        this.setup.animating = false;
      }.bind(this),100 + this.settings.transitionSpeed);
    },

    addTransitionSettings: function(elem){
      var style = {};

      style['transitionDuration'] = this.settings.transitionSpeed + 's';
      style['transitionTimingFunction'] = this.settings.easing;

      elem.css(style);
    },

    removeTransitionSettings: function(elem){
      elem.css();
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
        pagination += '<li><a href="" data-item="'+i+'">'+(i)+'</a></li>';
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
          navigation += '<li class="slidr-prev"><a href="">Prev</a></li>';
          navigation += '<li class="slidr-next"><a href="">Next</a></li>';
          navigation += '</ul>';
      this.$elem.after(navigation);

      this.$navigation = this.$container.find('.slidr-navigation');
      this.$next = this.$navigation.find('.slidr-next a');
      this.$prev = this.$navigation.find('.slidr-prev a');
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