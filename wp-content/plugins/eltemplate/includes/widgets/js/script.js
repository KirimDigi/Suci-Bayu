(function ($) {
  "use strict";

  var getElementSettings = function ($element) {
    var elementSettings = {},
      elementSettings = $element.data("settings") || {};

    return elementSettings;
  };

  var isEditMode = false;

  var AdvancedAccordionHandler = function ($scope, $) {
    var accordionTitle = $scope.find(".elementor-tab-title"),
      elementSettings = getElementSettings($scope),
      accordionSpeed = elementSettings.toggle_speed;

    // Open default actived tab
    accordionTitle.each(function () {
      if ($(this).hasClass("eltemplate-faq-tab-active-default")) {
        $(this).addClass("eltemplate-faq-tab-show eltemplate-faq-tab-active");
        $(this).next().slideDown();
      }
    });

    // Remove multiple click event for nested accordion
    accordionTitle.unbind("click");

    accordionTitle.on("click keypress", function (e) {
      e.preventDefault();

      var validClick =
        e.which == 1 || e.which == 13 || e.which == 32 || e.which == undefined
          ? true
          : false;

      if (!validClick) {
        return;
      }

      var $this = $(this),
        $item = $this.parent(),
        container = $this.closest(".eltemplate-faq"),
        item = $this.closest(".elementor-toggle-item"),
        title = container.find(".elementor-tab-title"),
        content = container.find(".eltemplate-tab-content");

      $(document).trigger("ppe-accordion-switched", [$item]);

      // For acccordion type 'toggle'
      if ($this.hasClass("eltemplate-faq-tab-show")) {
        $this.removeClass("eltemplate-faq-tab-show eltemplate-faq-tab-active");
        $this.next().slideUp(300);
      } else {
        $this.addClass("eltemplate-faq-tab-show eltemplate-faq-tab-active");
        $this.next().slideDown(300);
      }
    });

    // Trigger filter by hash parameter in URL.
    advanced_accordion_hashchange();

    // Trigger filter on hash change in URL.
    $(window).on("hashchange", function () {
      advanced_accordion_hashchange();
    });
  };

  function advanced_accordion_hashchange() {
    if (location.hash && $(location.hash).length > 0) {
      var element = $(location.hash + ".elementor-tab-title");

      if (element && element.length > 0) {
        location.href = "#";
        $("html, body").animate(
          {
            scrollTop:
              element.parents(".elementor-toggle-item").offset().top -
              50 +
              "px",
          },
          500,
          function () {
            if (
              !element
                .parents(".elementor-tab-title")
                .hasClass("elementor-active")
            ) {
              element.trigger("click");
            }
          }
        );
      }
    }
  }

  $(window).on("elementor/frontend/init", function () {
    if (elementorFrontend.isEditMode()) {
      isEditMode = true;
    }

    elementorFrontend.hooks.addAction(
      "frontend/element_ready/eltemplate-faq.default",
      AdvancedAccordionHandler
    );
  });
})(jQuery);
