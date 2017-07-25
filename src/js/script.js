$(document).ready(function () {

  /*tabs*/
  (function () {
    $(".pop_new_menu_li").click(function () {
      $(".pop_new_product").addClass('none');
      $(".pop_new_menu .act").removeClass('act');
      $(this).addClass('act');
      $(".pop_new_product").eq($(this).closest('.col').index()).removeClass('none');
    });
  })();

  /*dropdown*/
  (function () {
    $(".customer_info_block_container span.icon").click(function () {

      if ($(".customer_info_block").hasClass('act')) {

        $(".customer_info_block").removeClass('act');
        $("div.visi").slideDown(300);

      } else {

        $("div.visi").slideUp(300);
        $(".customer_info_block").addClass('act');

      }
    });
  })();

  /*ScrollToAnchor && mobile menu*/
  (function () {
    /*ScrollToAnchor class*/
    (function() {
      function ScrollToAnchor(options) {
        this._listenedBlock = options.listenedBlock || document.body;
        this._translationElementSelector = options.translation || false;
      }

      ScrollToAnchor.prototype.init = function () {
        $(this._listenedBlock).on('click', this.anchorClickListener.bind(this));
      };
      ScrollToAnchor.prototype.anchorClickListener = function (e) {
        var elem = e.target;
        var anchor = elem.closest('a[href*="#"]:not([data-scroll="disable"])');

        if (!anchor) return;

        var anchorWithHash = anchor.closest('a[href^="#"]');
        var windowPath = window.location.origin + window.location.pathname;
        var anchorPath = anchor.href.slice(0, anchor.href.indexOf('#'));

        if (windowPath === anchorPath) {
          anchorWithHash = anchor;
        }

        if (!anchorWithHash || anchorWithHash.hash.length < 2) return;

        e.preventDefault();

        var target = anchorWithHash.hash;
        var translation = this.getTranslation(anchorWithHash);

        if (!document.querySelector(target)) return;

        this.smoothScroll(target, translation);
      };
      ScrollToAnchor.prototype.getTranslation = function (anchor) {
        var translation = 0;

        if (anchor.hasAttribute('data-translation')) {
          translation = anchor.getAttribute('data-translation');
        } else if (this._translationElementSelector) {
          $(this._translationElementSelector).each(function () {
            translation += this.offsetHeight;
          });
          //translation = document.querySelector(this._translationElementSelector).offsetHeight;
        }

        return translation;
      };
      ScrollToAnchor.prototype.smoothScroll = function (selector, translation) {
        $("html, body").animate({
            scrollTop: $(selector).offset().top - (translation || 0)
          },
          500
        );
      };

      window.ScrollToAnchor = ScrollToAnchor;
    })();

    /*content scroll*/
    (function () {
      var pageScroll = new ScrollToAnchor({
        listenedBlock: '.page'
      });
      pageScroll.init();
    })();

    /*mmenu*/
    (function () {
      /*mmenu scroll*/
      var mmenuScroll = new ScrollToAnchor({
        listenedBlock: document.getElementById('#m-menu')
      });


      setupMenu();

      function setupMenu() {
        var $menu = $('nav#m-menu');
        var $openMenuBtn = $('#hamburger');
        var $openMenuBtnWrapper = $('#m-menu-btn-wrapper');
        var isMenuOpen = false;
        var scrollBarWidth = getScrollBarWidth();
        var html = document.documentElement || document.body;

        $menu.mmenu({
          "extensions": ["fullscreen"],
          offCanvas: {
            //moveBackground: false,
            position: "top",
            zposition: "front"
          },
          //navbar: true,
          navbar: {
           title: 'Меню' //'Меню'
           },
          /*"navbars": [
            {
              'content': [

              ],
              'height': 2,
              "position": "top"
            },
            /!*{
             "position": "top"
             },*!/
            {
              'content': [

              ],
              'height': 3,
              "position": "bottom"
            }
          ]*/
        });

        var selector = false;
        $menu.find('li > a').on(
          'click',
          function (e) {
            selector = this.hash;
          }
        );

        var api = $menu.data('mmenu');
        api.bind('closed',
          function () {
            if (selector) {
              mmenuScroll.smoothScroll(selector);
              selector = false;
            }

            html.style.paddingRight = '';
            $openMenuBtnWrapper[0].style.right = 0;
            isMenuOpen = false;
          }
        );
        $openMenuBtn.on('click',
          function () {
            if (isMenuOpen) {
              api.close();
              isMenuOpen = false;
            } else {
              api.open();
              html.style.paddingRight = scrollBarWidth + 'px';
              $openMenuBtnWrapper[0].style.right = scrollBarWidth + 'px';
              isMenuOpen = true;
            }
          });

      }

      function getScrollBarWidth() {
        var div = document.createElement('div');
        var scrollBarWidth = 0;

        $(div).css({
          'width': '100px',
          'height': '100px',
          'overflowY': 'scroll',
          'visibility': 'hidden'
        });
        document.body.appendChild(div);

        scrollBarWidth = div.offsetWidth - div.clientWidth;

        document.body.removeChild(div);

        return scrollBarWidth;
      }
    })();
  })();

  /*ScrollUp button*/
  (function(){
    function ScrollTop(tmpl) {
      this._tmpl = tmpl || '<div id="scrollUp"><i class="upButton"></i></div>';
      this._isActive = false;

      this.init();
    }
    ScrollTop.prototype.init = function () {
      this._$btn = $(this._tmpl);
      $('body').append(this._$btn);

      this.scrollBtnToggler();

      this._$btn.on('click', this.scrollTop.bind(this));
      $(window).on('scroll', this.scrollBtnToggler.bind(this));
    };
    ScrollTop.prototype.scrollBtnToggler = function () {
      if ( $(document).scrollTop() > $(window).height() && !this._isActive ) {
        this._$btn.fadeIn({queue : false, duration: 400})
          .animate({'bottom' : '40px'}, 400);
        this._isActive = true;
      } else if ( $(document).scrollTop() < $(window).height() && this._isActive ) {
        this._$btn.fadeOut({queue : false, duration: 400})
          .animate({'bottom' : '-20px'}, 400);
        this._isActive = false;
      }
    };
    ScrollTop.prototype.scrollTop = function(){
      $("html, body").animate({scrollTop: 0}, 500);
      return false;
    };

    var scrollTopBtn = new ScrollTop();
  })();

  /**
   * Animate touch event mobile
   **/
  (function(){
    var scroller=false,
      button = $('a.submit, a.btn');

    $(button).bind({
      touchstart: function(event){
        var elem=$(this);
        clickable=setTimeout(function () { elem.addClass('active');}, 100);
      },

      touchmove: function(event){
        clearTimeout(clickable);
        scroller=true;
      },

      touchend: function(event){
        var elem=$(this);
        clearTimeout(clickable);

        if(!scroller)
        {
          elem.addClass('active');
          setTimeout(function () { elem.removeClass('active');}, 50);
        }
        else
        {
          elem.removeClass('active');
        }
      }
    });
  })();


  /*
   $("input.button").click( function () {

   $(this).attr("disabled","true");

   });
   */

});

