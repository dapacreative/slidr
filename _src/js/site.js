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
        mode: "vertical"
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