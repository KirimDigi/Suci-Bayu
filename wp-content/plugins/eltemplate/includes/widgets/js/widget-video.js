(function ($) {
  const CustomVideoHandler = elementorModules.frontend.handlers.Base.extend({
    getDefaultSettings() {
      return {
        selectors: {
          video: ".elementor-video",
          overlay: ".elementor-custom-embed-image-overlay",
          playIcon: ".elementor-custom-embed-play",
          iframe: ".elementor-video-iframe",
        },
      };
    },

    getDefaultElements() {
      const selectors = this.getSettings("selectors");
      return {
        $video: this.$element.find(selectors.video),
        $overlay: this.$element.find(selectors.overlay),
        $iframe: this.$element.find(selectors.iframe),
        $playIcon: this.$element.find(selectors.playIcon),
      };
    },

    bindEvents() {
      this.elements.$overlay.on("click", this.handleVideo.bind(this));
      this.elements.$playIcon.on("click", this.handleVideo.bind(this));
    },

    handleVideo() {
      const settings = this.getElementSettings();
      const { $overlay, $iframe, $video } = this.elements;

      $overlay.remove();

      // HTML5 Video
      if ($video.length) {
        $video[0].play();
      }

      // YouTube iframe
      if ($iframe.length && $iframe.data("lazy-load")) {
        let src = $iframe.data("lazy-load");
        if (settings.autoplay) {
          src += (src.includes("?") ? "&" : "?") + "autoplay=1";
        }
        $iframe.attr("src", src).attr("allow", "autoplay");
      }
    },
  });

  $(window).on("elementor/frontend/init", function () {
    elementorFrontend.hooks.addAction(
      "frontend/element_ready/eltemplate-video.default",
      function ($scope) {
        elementorFrontend.elementsHandler.addHandler(CustomVideoHandler, {
          $element: $scope,
        });
      }
    );
  });
})(jQuery);
