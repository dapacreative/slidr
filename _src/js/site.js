/* Scripts */

//Site

var Site = (function($) {
  
  return {
      
    init: function() {
      this.cacheDom();
      this.bindEvents();
      this.initSlider();
    },

    cacheDom: function() {
      this.$site = $('html');
      this.$slider = this.$site.find('.slidr');
    },
    
    bindEvents: function() {      
      
    },

    initSlider: function() {
      this.$slider.slidr({
        mode: "wipe",
        easing: "cubic-bezier(1,.1,0,0.9)",
        speed: 500
      });
    }
  
  };

})(jQuery);
  

//On Document Ready
$(function() {
    
});

//On Window Load
$(window).load(function() {
  Site.init();
});