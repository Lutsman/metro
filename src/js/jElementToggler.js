/*BlockToggler*/
'use strict';

//TODO добавить возможность програмного добавления групп
//TODO на открыти/закрытие/переключени при передаче колбека, обхеденять с колбеком родным

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

(function (factory) {
  if (typeof define === 'function' && define.amd) {
    // AMD (Register as an anonymous module)
    define(['jquery'], factory);
  } else if ((typeof exports === 'undefined' ? 'undefined' : _typeof(exports)) === 'object') {
    // Node/CommonJS
    module.exports = factory(require('jquery'));
  } else {
    // Browser globals
    factory(jQuery);
  }
})(function ($) {
  var JElementTogglerController = function () {
    function JElementTogglerController(options) {
      _classCallCheck(this, JElementTogglerController);

      this._togglerBtn = options.togglerBtn || null;
      this._listenedEl = options.listenedEl || document.body;
      //this._delegated = options.delegated || false;
      //this._delegatedContainer = options.delegatedContainer || null;
      this._targetSelector = options.target || null;
      this._getTarget = options.getTarget || null; //func, arg: this._$togglerBtn, return: target
      this._groupName = options.groupName || null;
      this._closeBtnSelector = options.closeBtnSelector || '.js__et-close';
      this._animation = options.animation || 'simple'; // 'none', 'simple', 'slide', 'fade'
      this._animationDuration = options.animationDuration || 400;
      this._openAnimation = options.openAnimation || this._animation;
      this._closeAnimation = options.closeAnimation || this._animation;
      this._switchAnimation = options.switchAnimation || this._animation;
      this._openAnimationDuration = options.openAnimationDuration || this._animationDuration;
      this._closeAnimationDuration = options.closeAnimationDuration || this._animationDuration;
      this._switchAnimationDuration = options.switchAnimationDuration || this._animationDuration;
      this._onBeforeOpen = options.onBeforeOpen || null;
      this._onAfterOpen = options.onAfterOpen || null;
      this._onBeforeClose = options.onBeforeClose || null;
      this._onAfterClose = options.onAfterClose || null;
      this._onBeforeSwitch = options.onBeforeSwitch || null;
      this._onAfterSwitch = options.onAfterSwitch || null;
      this._outerClickClose = options.outerClick || false;
      this._disallowedActions = options.disallowedActions || [];
      this.actions = {
        open: 'open',
        close: 'close',
        switch: 'switch'
      };
      this._isActive = false;
      this._isWorking = false;
      this.userClassName = options.className || {};
      this.className = {
        initializedToggler: 'js__et-toggler-initialized',
        initializedTarget: 'js__et-target-initialized',
        active: 'active'
      };
      this.events = {
        beforeOpen: 'jElementToggler:beforeOpen',
        afterOpen: 'jElementToggler:afterOpen',
        beforeClose: 'jElementToggler:beforeClose',
        afterClose: 'jElementToggler:afterClose',
        beforeSwitch: 'jElementToggler:beforeSwitch',
        afterSwitch: 'jElementToggler:afterSwitch',
        openGroup: 'jElementToggler:openGroup',
        closeGroup: 'jElementToggler:closeGroup',

        /*managing events*/
        open: 'jElementToggler:open',
        close: 'jElementToggler:close',
        start: 'jElementToggler:start',
        stop: 'jElementToggler:stop'
      };

      this.init();
    }

    _createClass(JElementTogglerController, [{
      key: 'init',
      value: function init() {
        var x = 1;
        $.extend(this.className, this.userClassName);
        this.bindElements();

        if ((!this._$target || !this._$target.length) && this._animation !== 'none') return; //if still no target stop init func

        this.bindHandlers();
        this.attachHandlers();

        if (this._animation !== 'none') {
          // возможно лишнее условие
          this._$target.hide();
        }

        if (this._$togglerBtn.hasClass(this.className.active)) {
          this.showEl('simple');
          this._isActive = true;
        }

        this._isWorking = true;
        this._isInited = true;
      }
    }, {
      key: 'bindElements',
      value: function bindElements() {
        this._$togglerBtn = $(this._togglerBtn);
        this._$listenedEl = $(this._listenedEl);
        this._groupName = this._groupName || this._$togglerBtn.attr('data-et-group');

        if (typeof this._getTarget === 'function') {
          this._$target = $(this._getTarget(this._$togglerBtn, this));
        } else {
          this._targetSelector = this._targetSelector || this._$togglerBtn.attr('data-et-target') || this._$togglerBtn.attr('href');
          this._$target = $(this._targetSelector);
        }
      }
    }, {
      key: 'bindHandlers',
      value: function bindHandlers() {
        var maxAnimationDuration = this._openAnimationDuration >= this._closeAnimationDuration ? this._openAnimationDuration : this._closeAnimationDuration;

        this._debouncedTogglerHandler = this.debounce(this.togglerHandler, maxAnimationDuration + 5, this);
        this._openBlockListener = this.openBlockListener.bind(this);
        this._openGroupHandler = this.switchHandler.bind(this);
        this._closeGroupHandler = this.closeGroupHandler.bind(this);
        this._closeBtnListener = this.closeBtnListener.bind(this);
        this._outerClickListener = this.outerClickListener.bind(this);
        this._openElHandler = this.openElHandler.bind(this);
        this._closeElHandler = this.closeElHandler.bind(this);
        this._startHandler = this.startHandler.bind(this);
        this._stopHandler = this.stopHandler.bind(this);
      }
    }, {
      key: 'attachHandlers',
      value: function attachHandlers() {
        var _$togglerBtn$on;

        var clickEvent = this._clickEvent = this.isIOS() ? 'touchstart' : 'click';
        var $listenedEl = this._$listenedEl;
        var $target = this._$target;

        if ($target.length) {
          $target.on('click', this._closeBtnListener).addClass(this.className.initializedTarget);
        }

        if (this._outerClickClose) {
          $listenedEl.on(this._clickEvent, this._outerClickListener);
        }

        if (this._groupName) {
          var _$listenedEl$on;

          $listenedEl.on((_$listenedEl$on = {}, _defineProperty(_$listenedEl$on, this.events.beforeOpen, this._openBlockListener), _defineProperty(_$listenedEl$on, this.events.openGroup, this._openGroupHandler), _defineProperty(_$listenedEl$on, this.events.closeGroup, this._closeGroupHandler), _$listenedEl$on));
        }

        this._$togglerBtn.on((_$togglerBtn$on = {}, _defineProperty(_$togglerBtn$on, clickEvent, this._debouncedTogglerHandler), _defineProperty(_$togglerBtn$on, this.events.open, this._openElHandler), _defineProperty(_$togglerBtn$on, this.events.close, this._closeElHandler), _defineProperty(_$togglerBtn$on, this.events.stop, this._stopHandler), _$togglerBtn$on)).addClass(this.className.initializedToggler);

        if (!this._isInited) {
          this._$togglerBtn.on(_defineProperty({}, this.events.start, this._startHandler));
        }
      }
    }, {
      key: 'detachHandlers',
      value: function detachHandlers() {
        var _$togglerBtn$off;

        var clickEvent = this._clickEvent = this.isIOS() ? 'touchstart' : 'click';
        var $listenedEl = this._$listenedEl;
        var $target = this._$target;

        if ($target.length) {
          $target.off('click', this._closeBtnListener).removeClass(this.className.initializedTarget);
        }

        if (this._outerClickClose) {
          $listenedEl.off(this._clickEvent, this._outerClickListener);
        }

        if (this._groupName) {
          var _$listenedEl$off;

          $listenedEl.off((_$listenedEl$off = {}, _defineProperty(_$listenedEl$off, this.events.beforeOpen, this._openBlockListener), _defineProperty(_$listenedEl$off, this.events.closeGroup, this._closeGroupHandler), _$listenedEl$off));
        }

        this._$togglerBtn.off((_$togglerBtn$off = {}, _defineProperty(_$togglerBtn$off, clickEvent, this._debouncedTogglerHandler), _defineProperty(_$togglerBtn$off, this.events.open, this._openElHandler), _defineProperty(_$togglerBtn$off, this.events.close, this._closeElHandler), _defineProperty(_$togglerBtn$off, this.events.stop, this._stopHandler), _$togglerBtn$off)).removeClass(this.className.initializedToggler);
      }
    }, {
      key: 'start',
      value: function start() {
        if (this._isWorking) return;

        this.attachHandlers();
        this._isWorking = true;
      }
    }, {
      key: 'stop',
      value: function stop() {
        if (!this._isWorking) return;

        this.detachHandlers();
        this._isWorking = false;
      }
    }, {
      key: 'startHandler',
      value: function startHandler(e) {
        var el = e.target;

        if (!this.isSameToggler(el)) return;

        this.start();
      }
    }, {
      key: 'stopHandler',
      value: function stopHandler(e) {
        var el = e.target;

        if (!this.isSameToggler(el)) return;

        this.stop();
      }
    }, {
      key: 'isSameToggler',
      value: function isSameToggler(el) {
        //let $el = $(el);
        //let $closestTogglerBtn = $el.closest('.' + this.className.initializedToggler);

        return this._$togglerBtn.is(el);
      }
    }, {
      key: 'togglerHandler',
      value: function togglerHandler(e) {
        var $el = $(e.target);
        var isTarget = !!$el.closest(this._$target).length && !$el.is(this._$togglerBtn);

        if (!this.isHidden(this._$target) && this._animation !== 'none') {
          //возможно стоит также удалить
          this._isActive = true;
        }

        if (this._isActive && isTarget) return;

        e.preventDefault();

        if (this._isActive) {
          this.hideEl();
        } else {
          this.showEl();
        }
      }
    }, {
      key: 'openElHandler',
      value: function openElHandler(e, animation, duration, callback) {
        var el = e.target;

        if (!this.isSameToggler(el)) return;

        this.showEl(animation, duration, callback);
      }
    }, {
      key: 'closeElHandler',
      value: function closeElHandler(e, animation, duration, callback) {
        var el = e.target;

        if (!this.isSameToggler(el)) return;

        this.hideEl(animation, duration, callback);
      }
    }, {
      key: 'openBlockListener',
      value: function openBlockListener(e, controller) {
        if (!this._isActive || controller._$togglerBtn.is(this._$togglerBtn) || controller._groupName !== this._groupName || controller._groupName === undefined) {
          return;
        }

        this.switchEl();
      }
    }, {
      key: 'switchHandler',
      value: function switchHandler(e, groupName) {
        if (groupName !== this._groupName || groupName === undefined) {
          return;
        }

        this.switchEl();
      }
    }, {
      key: 'closeGroupHandler',
      value: function closeGroupHandler(e, groupName) {
        if (!this._isActive || groupName !== this._groupName || groupName === undefined) {
          return;
        }

        this.hideEl();
      }
    }, {
      key: 'outerClickListener',
      value: function outerClickListener(e) {
        //console.dir(this);
        if (!this._isActive) return;

        var $el = $(e.target);
        var isOuter = !$el.closest(this._$target.add(this._$togglerBtn)).length;

        if (!isOuter) return;

        this.hideEl();
      }
    }, {
      key: 'closeBtnListener',
      value: function closeBtnListener(e) {
        var $el = $(e.target);
        var $closeBtn = $el.closest(this._closeBtnSelector);

        if (!$closeBtn.length) return;

        var $currTarget = $closeBtn.closest('.' + this.className.initializedTarget);

        if (!$currTarget.is(this._$target)) return;

        this.hideEl();
      }
    }, {
      key: 'showEl',
      value: function showEl(animation, duration, callback) {
        if (~this._disallowedActions.indexOf(this.actions.open)) return;

        var $target = this._$target;
        callback = typeof callback === 'function' ? callback.bind(this) : this.showCallback.bind(this);
        duration = duration || this._openAnimationDuration;
        animation = animation || this._openAnimation;

        this._$togglerBtn.addClass(this.className.active);
        $target.addClass(this.className.active);
        this._isActive = true;

        if (typeof this._onBeforeOpen === 'function') {
          this._onBeforeOpen(this);
        }

        this._$togglerBtn.trigger(this.events.beforeOpen, [this]);

        switch (animation) {
          case 'none':
            callback();
            break;
          case 'simple':
            $target.show();
            callback();
            break;
          case 'slide':
            if (!$target.length) {
              callback();
            } else {
              $target.slideDown(duration, callback);
            }
            break;
          case 'fade':
            if (!$target.length) {
              callback();
            } else {
              $target.fadeIn(duration, callback);
            }
            break;
        }
      }
    }, {
      key: 'showCallback',
      value: function showCallback() {
        if (typeof this._onAfterOpen === 'function') {
          this._onAfterOpen(this);
        }

        this._$togglerBtn.trigger(this.events.afterOpen, [this]);

        if (this._outerClickClose) {
          this._$listenedEl.on(this._clickEvent, this.outerClickListener);
        }
      }
    }, {
      key: 'hideEl',
      value: function hideEl(animation, duration, callback) {
        if (~this._disallowedActions.indexOf(this.actions.close)) return;

        var $target = this._$target;
        callback = typeof callback === 'function' ? callback.bind(this) : this.hideCallback.bind(this);
        duration = duration || this._closeAnimationDuration;
        animation = animation || this._closeAnimation;

        this._$togglerBtn.removeClass(this.className.active);
        $target.removeClass(this.className.active);
        this._isActive = false;

        if (typeof this._onBeforeClose === 'function') {
          this._onBeforeClose(this);
        }

        this._$togglerBtn.trigger(this.events.beforeClose, [this]);

        switch (animation) {
          case 'none':
            callback();
            break;
          case 'simple':
            $target.hide();
            callback();
            break;
          case 'slide':
            $target.slideUp(duration, callback);
            break;
          case 'fade':
            $target.fadeOut(duration, callback);
            break;
        }
      }
    }, {
      key: 'hideCallback',
      value: function hideCallback() {
        if (typeof this._onAfterClose === 'function') {
          this._onAfterClose(this);
        }

        this._$togglerBtn.trigger(this.events.afterClose, [this]);

        if (this._outerClickClose) {
          this._$listenedEl.off(this._clickEvent, this.outerClickListener);
        }
      }
    }, {
      key: 'switchEl',
      value: function switchEl(animation, duration, callback) {
        if (~this._disallowedActions.indexOf(this.actions.switch)) return;

        var $target = this._$target;
        callback = typeof callback === 'function' ? callback.bind(this) : this.switchCallback.bind(this);
        duration = duration || this._switchAnimationDuration;
        animation = animation || this._switchAnimation;

        this._$togglerBtn.removeClass(this.className.active);
        $target.removeClass(this.className.active);
        this._isActive = false;

        if (typeof this._onBeforeSwitch === 'function') {
          this._onBeforeSwitch(this);
        }

        this._$togglerBtn.trigger(this.events.beforeSwitch, [this]);

        switch (animation) {
          case 'none':
            callback();
            break;
          case 'simple':
            $target.hide();
            callback();
            break;
          case 'slide':
            $target.slideUp(duration, callback);
            break;
          case 'fade':
            $target.fadeOut(duration, callback);
            break;
        }
      }
    }, {
      key: 'switchCallback',
      value: function switchCallback() {
        if (typeof this._onAfterClose === 'function') {
          this._onAfterSwitch(this);
        }

        this._$togglerBtn.trigger(this.events.afterSwitch, [this]);

        if (this._outerClickClose) {
          this._$listenedEl.off(this._clickEvent, this.outerClickListener);
        }
      }
    }, {
      key: 'isIOS',
      value: function isIOS() {
        return (/iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream
        );
      }
    }, {
      key: 'isHidden',
      value: function isHidden(el) {
        var $el = $(el);

        return $el.is(':hidden') || $el.css('visibility') === 'hidden' || +$el.css('opacity') === 0;
      }
    }, {
      key: 'getSelf',
      value: function getSelf() {
        return this;
      }

      /**
       * Debounces a function. Returns a function that calls the original fn function only if no invocations have been made
       * within the last quietMillis milliseconds.
       *
       * @param quietMillis number of milliseconds to wait before invoking fn
       * @param fn function to be debounced
       * @param bindedThis object to be used as this reference within fn
       * @return debounced version of fn
       */

    }, {
      key: 'debounce',
      value: function debounce(fn, quietMillis, bindedThis) {
        var isWaiting = false;
        return function func() {
          if (isWaiting) return;

          if (bindedThis === undefined) {
            bindedThis = this;
          }

          fn.apply(bindedThis, arguments);
          isWaiting = true;

          setTimeout(function () {
            isWaiting = false;
          }, quietMillis);
        };
      }
    }, {
      key: 'setOptions',
      value: function setOptions(options) {
        this.detachHandlers();

        for (var key in options) {
          this['_' + key] = options[key];
        }

        this.init();
      }
    }]);

    return JElementTogglerController;
  }();

  var DelegatedTogglerController = function () {
    function DelegatedTogglerController(options) {
      _classCallCheck(this, DelegatedTogglerController);

      this._$delegatedContainer = options.$delegatedContainer;
      this._togglerBtn = options.togglerBtn;
      this._jElementTogglerOptions = options;

      this.init();
    }

    _createClass(DelegatedTogglerController, [{
      key: 'init',
      value: function init() {
        this._jElementTogglerOptions.togglerBtn = null;
        this._clickHandler = this.clickHandler.bind(this);
        this._$delegatedContainer.on('click', this._clickHandler);
      }
    }, {
      key: 'clickHandler',
      value: function clickHandler(e) {
        var target = e.target;
        var togglerBtn = target.closest(this._togglerBtn);

        if (!togglerBtn || togglerBtn.jElementToggler && togglerBtn.jElementToggler instanceof JElementTogglerController) return;

        $(togglerBtn).jElementToggler(this._jElementTogglerOptions);
      }
    }]);

    return DelegatedTogglerController;
  }();

  $.fn.jElementToggler = function () {
    var _ = this;
    var options = arguments[0] || {};
    var args = Array.prototype.slice.call(arguments, 1);

    for (var i = 0; i < _.length; i++) {
      if ((typeof options === 'undefined' ? 'undefined' : _typeof(options)) === 'object') {
        if (options.delegated) {
          if (!$.isArray(_[i].delegatedToggler)) {
            _[i].delegatedToggler = [];
          }

          options.$delegatedContainer = $(_[i]);
          _[i].delegatedToggler.push(new DelegatedTogglerController(options));
        } else {
          options.togglerBtn = _[i];
          _[i].jElementToggler = new JElementTogglerController(options);
        }

        //options.togglerBtn = _[i];
        //_[i].jElementToggler = new JElementTogglerController(options);
      } else {
        var result = _[i].jElementToggler[options].call(_[i].jElementToggler, args);

        if (typeof result !== 'undefined') return result;
      }
    }

    return _;
  };
});
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImpzL2pFbGVtZW50VG9nZ2xlci5lczYuanMiXSwibmFtZXMiOlsiZmFjdG9yeSIsImRlZmluZSIsImFtZCIsImV4cG9ydHMiLCJtb2R1bGUiLCJyZXF1aXJlIiwialF1ZXJ5IiwiJCIsIkpFbGVtZW50VG9nZ2xlckNvbnRyb2xsZXIiLCJvcHRpb25zIiwiX3RvZ2dsZXJCdG4iLCJ0b2dnbGVyQnRuIiwiX2xpc3RlbmVkRWwiLCJsaXN0ZW5lZEVsIiwiZG9jdW1lbnQiLCJib2R5IiwiX3RhcmdldFNlbGVjdG9yIiwidGFyZ2V0IiwiX2dldFRhcmdldCIsImdldFRhcmdldCIsIl9ncm91cE5hbWUiLCJncm91cE5hbWUiLCJfY2xvc2VCdG5TZWxlY3RvciIsImNsb3NlQnRuU2VsZWN0b3IiLCJfYW5pbWF0aW9uIiwiYW5pbWF0aW9uIiwiX2FuaW1hdGlvbkR1cmF0aW9uIiwiYW5pbWF0aW9uRHVyYXRpb24iLCJfb3BlbkFuaW1hdGlvbiIsIm9wZW5BbmltYXRpb24iLCJfY2xvc2VBbmltYXRpb24iLCJjbG9zZUFuaW1hdGlvbiIsIl9zd2l0Y2hBbmltYXRpb24iLCJzd2l0Y2hBbmltYXRpb24iLCJfb3BlbkFuaW1hdGlvbkR1cmF0aW9uIiwib3BlbkFuaW1hdGlvbkR1cmF0aW9uIiwiX2Nsb3NlQW5pbWF0aW9uRHVyYXRpb24iLCJjbG9zZUFuaW1hdGlvbkR1cmF0aW9uIiwiX3N3aXRjaEFuaW1hdGlvbkR1cmF0aW9uIiwic3dpdGNoQW5pbWF0aW9uRHVyYXRpb24iLCJfb25CZWZvcmVPcGVuIiwib25CZWZvcmVPcGVuIiwiX29uQWZ0ZXJPcGVuIiwib25BZnRlck9wZW4iLCJfb25CZWZvcmVDbG9zZSIsIm9uQmVmb3JlQ2xvc2UiLCJfb25BZnRlckNsb3NlIiwib25BZnRlckNsb3NlIiwiX29uQmVmb3JlU3dpdGNoIiwib25CZWZvcmVTd2l0Y2giLCJfb25BZnRlclN3aXRjaCIsIm9uQWZ0ZXJTd2l0Y2giLCJfb3V0ZXJDbGlja0Nsb3NlIiwib3V0ZXJDbGljayIsIl9kaXNhbGxvd2VkQWN0aW9ucyIsImRpc2FsbG93ZWRBY3Rpb25zIiwiYWN0aW9ucyIsIm9wZW4iLCJjbG9zZSIsInN3aXRjaCIsIl9pc0FjdGl2ZSIsIl9pc1dvcmtpbmciLCJ1c2VyQ2xhc3NOYW1lIiwiY2xhc3NOYW1lIiwiaW5pdGlhbGl6ZWRUb2dnbGVyIiwiaW5pdGlhbGl6ZWRUYXJnZXQiLCJhY3RpdmUiLCJldmVudHMiLCJiZWZvcmVPcGVuIiwiYWZ0ZXJPcGVuIiwiYmVmb3JlQ2xvc2UiLCJhZnRlckNsb3NlIiwiYmVmb3JlU3dpdGNoIiwiYWZ0ZXJTd2l0Y2giLCJvcGVuR3JvdXAiLCJjbG9zZUdyb3VwIiwic3RhcnQiLCJzdG9wIiwiaW5pdCIsIngiLCJleHRlbmQiLCJiaW5kRWxlbWVudHMiLCJfJHRhcmdldCIsImxlbmd0aCIsImJpbmRIYW5kbGVycyIsImF0dGFjaEhhbmRsZXJzIiwiaGlkZSIsIl8kdG9nZ2xlckJ0biIsImhhc0NsYXNzIiwic2hvd0VsIiwiX2lzSW5pdGVkIiwiXyRsaXN0ZW5lZEVsIiwiYXR0ciIsIm1heEFuaW1hdGlvbkR1cmF0aW9uIiwiX2RlYm91bmNlZFRvZ2dsZXJIYW5kbGVyIiwiZGVib3VuY2UiLCJ0b2dnbGVySGFuZGxlciIsIl9vcGVuQmxvY2tMaXN0ZW5lciIsIm9wZW5CbG9ja0xpc3RlbmVyIiwiYmluZCIsIl9vcGVuR3JvdXBIYW5kbGVyIiwic3dpdGNoSGFuZGxlciIsIl9jbG9zZUdyb3VwSGFuZGxlciIsImNsb3NlR3JvdXBIYW5kbGVyIiwiX2Nsb3NlQnRuTGlzdGVuZXIiLCJjbG9zZUJ0bkxpc3RlbmVyIiwiX291dGVyQ2xpY2tMaXN0ZW5lciIsIm91dGVyQ2xpY2tMaXN0ZW5lciIsIl9vcGVuRWxIYW5kbGVyIiwib3BlbkVsSGFuZGxlciIsIl9jbG9zZUVsSGFuZGxlciIsImNsb3NlRWxIYW5kbGVyIiwiX3N0YXJ0SGFuZGxlciIsInN0YXJ0SGFuZGxlciIsIl9zdG9wSGFuZGxlciIsInN0b3BIYW5kbGVyIiwiY2xpY2tFdmVudCIsIl9jbGlja0V2ZW50IiwiaXNJT1MiLCIkbGlzdGVuZWRFbCIsIiR0YXJnZXQiLCJvbiIsImFkZENsYXNzIiwib2ZmIiwicmVtb3ZlQ2xhc3MiLCJkZXRhY2hIYW5kbGVycyIsImUiLCJlbCIsImlzU2FtZVRvZ2dsZXIiLCJpcyIsIiRlbCIsImlzVGFyZ2V0IiwiY2xvc2VzdCIsImlzSGlkZGVuIiwicHJldmVudERlZmF1bHQiLCJoaWRlRWwiLCJkdXJhdGlvbiIsImNhbGxiYWNrIiwiY29udHJvbGxlciIsInVuZGVmaW5lZCIsInN3aXRjaEVsIiwiaXNPdXRlciIsImFkZCIsIiRjbG9zZUJ0biIsIiRjdXJyVGFyZ2V0IiwiaW5kZXhPZiIsInNob3dDYWxsYmFjayIsInRyaWdnZXIiLCJzaG93Iiwic2xpZGVEb3duIiwiZmFkZUluIiwiaGlkZUNhbGxiYWNrIiwic2xpZGVVcCIsImZhZGVPdXQiLCJzd2l0Y2hDYWxsYmFjayIsInRlc3QiLCJuYXZpZ2F0b3IiLCJ1c2VyQWdlbnQiLCJ3aW5kb3ciLCJNU1N0cmVhbSIsImNzcyIsImZuIiwicXVpZXRNaWxsaXMiLCJiaW5kZWRUaGlzIiwiaXNXYWl0aW5nIiwiZnVuYyIsImFwcGx5IiwiYXJndW1lbnRzIiwic2V0VGltZW91dCIsImtleSIsIkRlbGVnYXRlZFRvZ2dsZXJDb250cm9sbGVyIiwiXyRkZWxlZ2F0ZWRDb250YWluZXIiLCIkZGVsZWdhdGVkQ29udGFpbmVyIiwiX2pFbGVtZW50VG9nZ2xlck9wdGlvbnMiLCJfY2xpY2tIYW5kbGVyIiwiY2xpY2tIYW5kbGVyIiwiakVsZW1lbnRUb2dnbGVyIiwiXyIsImFyZ3MiLCJBcnJheSIsInByb3RvdHlwZSIsInNsaWNlIiwiY2FsbCIsImkiLCJkZWxlZ2F0ZWQiLCJpc0FycmF5IiwiZGVsZWdhdGVkVG9nZ2xlciIsInB1c2giLCJyZXN1bHQiXSwibWFwcGluZ3MiOiJBQUFDO0FBQ0Q7O0FBRUM7QUFDQTs7Ozs7Ozs7OztBQUNELENBQUMsVUFBVUEsT0FBVixFQUFtQjtBQUNsQixNQUFJLE9BQU9DLE1B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QUF6RCxDQUFiOztBQUVBLFlBQUksT0FBT1UsTUFBUCxLQUFrQixXQUF0QixFQUFtQyxPQUFPQSxNQUFQO0FBQ3BDO0FBQ0Y7O0FBRUQsV0FBT1gsQ0FBUDtBQUNELEdBN0JEO0FBOEJELENBdmtCRCIsImZpbGUiOiJqcy9qRWxlbWVudFRvZ2dsZXIuZXM2LmpzIiwic291cmNlc0NvbnRlbnQiOlsiIC8qQmxvY2tUb2dnbGVyKi9cclxuJ3VzZSBzdHJpY3QnO1xyXG5cclxuIC8vVE9ETyDQtNC+0LHQsNCy0LjRgtGMINCy0L7Qt9C80L7QttC90L7RgdGC0Ywg0L/RgNC+0LPRgNCw0LzQvdC+0LPQviDQtNC+0LHQsNCy0LvQtdC90LjRjyDQs9GA0YPQv9C/XHJcbiAvL1RPRE8g0L3QsCDQvtGC0LrRgNGL0YLQuC/Qt9Cw0LrRgNGL0YLQuNC1L9C/0LXRgNC10LrQu9GO0YfQtdC90Lgg0L/RgNC4INC/0LXRgNC10LTQsNGH0LUg0LrQvtC70LHQtdC60LAsINC+0LHRhdC10LTQtdC90Y/RgtGMINGBINC60L7Qu9Cx0LXQutC+0Lwg0YDQvtC00L3Ri9C8XHJcbihmdW5jdGlvbiAoZmFjdG9yeSkge1xyXG4gIGlmICh0eXBlb2YgZGVmaW5lID09PSAnZnVuY3Rpb24nICYmIGRlZmluZS5hbWQpIHtcclxuICAgIC8vIEFNRCAoUmVnaXN0ZXIgYXMgYW4gYW5vbnltb3VzIG1vZHVsZSlcclxuICAgIGRlZmluZShbJ2pxdWVyeSddLCBmYWN0b3J5KTtcclxuICB9IGVsc2UgaWYgKHR5cGVvZiBleHBvcnRzID09PSAnb2JqZWN0Jykge1xyXG4gICAgLy8gTm9kZS9Db21tb25KU1xyXG4gICAgbW9kdWxlLmV4cG9ydHMgPSBmYWN0b3J5KHJlcXVpcmUoJ2pxdWVyeScpKTtcclxuICB9IGVsc2Uge1xyXG4gICAgLy8gQnJvd3NlciBnbG9iYWxzXHJcbiAgICBmYWN0b3J5KGpRdWVyeSk7XHJcbiAgfVxyXG59KShmdW5jdGlvbiAoJCkge1xyXG4gIGNsYXNzIEpFbGVtZW50VG9nZ2xlckNvbnRyb2xsZXIge1xyXG4gICAgY29uc3RydWN0b3IgKG9wdGlvbnMpIHtcclxuICAgICAgdGhpcy5fdG9nZ2xlckJ0biA9IG9wdGlvbnMudG9nZ2xlckJ0biB8fCBudWxsO1xyXG4gICAgICB0aGlzLl9saXN0ZW5lZEVsID0gb3B0aW9ucy5saXN0ZW5lZEVsIHx8IGRvY3VtZW50LmJvZHk7XHJcbiAgICAgIC8vdGhpcy5fZGVsZWdhdGVkID0gb3B0aW9ucy5kZWxlZ2F0ZWQgfHwgZmFsc2U7XHJcbiAgICAgIC8vdGhpcy5fZGVsZWdhdGVkQ29udGFpbmVyID0gb3B0aW9ucy5kZWxlZ2F0ZWRDb250YWluZXIgfHwgbnVsbDtcclxuICAgICAgdGhpcy5fdGFyZ2V0U2VsZWN0b3IgPSBvcHRpb25zLnRhcmdldCB8fCBudWxsO1xyXG4gICAgICB0aGlzLl9nZXRUYXJnZXQgPSBvcHRpb25zLmdldFRhcmdldCB8fCBudWxsOyAvL2Z1bmMsIGFyZzogdGhpcy5fJHRvZ2dsZXJCdG4sIHJldHVybjogdGFyZ2V0XHJcbiAgICAgIHRoaXMuX2dyb3VwTmFtZSA9IG9wdGlvbnMuZ3JvdXBOYW1lIHx8IG51bGwgO1xyXG4gICAgICB0aGlzLl9jbG9zZUJ0blNlbGVjdG9yID0gb3B0aW9ucy5jbG9zZUJ0blNlbGVjdG9yIHx8ICcuanNfX2V0LWNsb3NlJztcclxuICAgICAgdGhpcy5fYW5pbWF0aW9uID0gb3B0aW9ucy5hbmltYXRpb24gfHwgJ3NpbXBsZSc7ICAvLyAnbm9uZScsICdzaW1wbGUnLCAnc2xpZGUnLCAnZmFkZSdcclxuICAgICAgdGhpcy5fYW5pbWF0aW9uRHVyYXRpb24gPSBvcHRpb25zLmFuaW1hdGlvbkR1cmF0aW9uIHx8IDQwMDtcclxuICAgICAgdGhpcy5fb3BlbkFuaW1hdGlvbiA9IG9wdGlvbnMub3BlbkFuaW1hdGlvbiB8fCB0aGlzLl9hbmltYXRpb247XHJcbiAgICAgIHRoaXMuX2Nsb3NlQW5pbWF0aW9uID0gb3B0aW9ucy5jbG9zZUFuaW1hdGlvbiB8fCB0aGlzLl9hbmltYXRpb247XHJcbiAgICAgIHRoaXMuX3N3aXRjaEFuaW1hdGlvbiA9IG9wdGlvbnMuc3dpdGNoQW5pbWF0aW9uIHx8IHRoaXMuX2FuaW1hdGlvbjtcclxuICAgICAgdGhpcy5fb3BlbkFuaW1hdGlvbkR1cmF0aW9uID0gb3B0aW9ucy5vcGVuQW5pbWF0aW9uRHVyYXRpb24gIHx8IHRoaXMuX2FuaW1hdGlvbkR1cmF0aW9uIDtcclxuICAgICAgdGhpcy5fY2xvc2VBbmltYXRpb25EdXJhdGlvbiA9IG9wdGlvbnMuY2xvc2VBbmltYXRpb25EdXJhdGlvbiAgfHwgdGhpcy5fYW5pbWF0aW9uRHVyYXRpb24gO1xyXG4gICAgICB0aGlzLl9zd2l0Y2hBbmltYXRpb25EdXJhdGlvbiA9IG9wdGlvbnMuc3dpdGNoQW5pbWF0aW9uRHVyYXRpb24gIHx8IHRoaXMuX2FuaW1hdGlvbkR1cmF0aW9uIDtcclxuICAgICAgdGhpcy5fb25CZWZvcmVPcGVuID0gb3B0aW9ucy5vbkJlZm9yZU9wZW4gfHwgbnVsbDtcclxuICAgICAgdGhpcy5fb25BZnRlck9wZW4gPSBvcHRpb25zLm9uQWZ0ZXJPcGVuIHx8IG51bGw7XHJcbiAgICAgIHRoaXMuX29uQmVmb3JlQ2xvc2UgPSBvcHRpb25zLm9uQmVmb3JlQ2xvc2UgfHwgbnVsbDtcclxuICAgICAgdGhpcy5fb25BZnRlckNsb3NlID0gb3B0aW9ucy5vbkFmdGVyQ2xvc2UgfHwgbnVsbDtcclxuICAgICAgdGhpcy5fb25CZWZvcmVTd2l0Y2ggPSBvcHRpb25zLm9uQmVmb3JlU3dpdGNoIHx8IG51bGw7XHJcbiAgICAgIHRoaXMuX29uQWZ0ZXJTd2l0Y2ggPSBvcHRpb25zLm9uQWZ0ZXJTd2l0Y2ggfHwgbnVsbDtcclxuICAgICAgdGhpcy5fb3V0ZXJDbGlja0Nsb3NlID0gb3B0aW9ucy5vdXRlckNsaWNrIHx8IGZhbHNlO1xyXG4gICAgICB0aGlzLl9kaXNhbGxvd2VkQWN0aW9ucyA9IG9wdGlvbnMuZGlzYWxsb3dlZEFjdGlvbnMgfHwgW107XHJcbiAgICAgIHRoaXMuYWN0aW9ucyA9IHtcclxuICAgICAgICBvcGVuOiAnb3BlbicsXHJcbiAgICAgICAgY2xvc2U6ICdjbG9zZScsXHJcbiAgICAgICAgc3dpdGNoOiAnc3dpdGNoJ1xyXG4gICAgICB9O1xyXG4gICAgICB0aGlzLl9pc0FjdGl2ZSA9IGZhbHNlO1xyXG4gICAgICB0aGlzLl9pc1dvcmtpbmcgPSBmYWxzZTtcclxuICAgICAgdGhpcy51c2VyQ2xhc3NOYW1lID0gb3B0aW9ucy5jbGFzc05hbWUgfHwge307XHJcbiAgICAgIHRoaXMuY2xhc3NOYW1lID0ge1xyXG4gICAgICAgIGluaXRpYWxpemVkVG9nZ2xlcjogJ2pzX19ldC10b2dnbGVyLWluaXRpYWxpemVkJyxcclxuICAgICAgICBpbml0aWFsaXplZFRhcmdldDogJ2pzX19ldC10YXJnZXQtaW5pdGlhbGl6ZWQnLFxyXG4gICAgICAgIGFjdGl2ZTogJ2FjdGl2ZSdcclxuICAgICAgfTtcclxuICAgICAgdGhpcy5ldmVudHMgPSB7XHJcbiAgICAgICAgYmVmb3JlT3BlbjogJ2pFbGVtZW50VG9nZ2xlcjpiZWZvcmVPcGVuJyxcclxuICAgICAgICBhZnRlck9wZW46ICdqRWxlbWVudFRvZ2dsZXI6YWZ0ZXJPcGVuJyxcclxuICAgICAgICBiZWZvcmVDbG9zZTogJ2pFbGVtZW50VG9nZ2xlcjpiZWZvcmVDbG9zZScsXHJcbiAgICAgICAgYWZ0ZXJDbG9zZTogJ2pFbGVtZW50VG9nZ2xlcjphZnRlckNsb3NlJyxcclxuICAgICAgICBiZWZvcmVTd2l0Y2g6ICdqRWxlbWVudFRvZ2dsZXI6YmVmb3JlU3dpdGNoJyxcclxuICAgICAgICBhZnRlclN3aXRjaDogJ2pFbGVtZW50VG9nZ2xlcjphZnRlclN3aXRjaCcsXHJcbiAgICAgICAgb3Blbkdyb3VwOiAnakVsZW1lbnRUb2dnbGVyOm9wZW5Hcm91cCcsXHJcbiAgICAgICAgY2xvc2VHcm91cDogJ2pFbGVtZW50VG9nZ2xlcjpjbG9zZUdyb3VwJyxcclxuXHJcbiAgICAgICAgLyptYW5hZ2luZyBldmVudHMqL1xyXG4gICAgICAgIG9wZW46ICdqRWxlbWVudFRvZ2dsZXI6b3BlbicsXHJcbiAgICAgICAgY2xvc2U6ICdqRWxlbWVudFRvZ2dsZXI6Y2xvc2UnLFxyXG4gICAgICAgIHN0YXJ0OiAnakVsZW1lbnRUb2dnbGVyOnN0YXJ0JyxcclxuICAgICAgICBzdG9wOiAnakVsZW1lbnRUb2dnbGVyOnN0b3AnXHJcbiAgICAgIH07XHJcblxyXG4gICAgICB0aGlzLmluaXQoKTtcclxuICAgIH1cclxuXHJcbiAgICBpbml0KCkge1xyXG4gICAgICB2YXIgeCA9IDE7XHJcbiAgICAgICQuZXh0ZW5kKHRoaXMuY2xhc3NOYW1lLCB0aGlzLnVzZXJDbGFzc05hbWUpO1xyXG4gICAgICB0aGlzLmJpbmRFbGVtZW50cygpO1xyXG5cclxuICAgICAgaWYgKCghdGhpcy5fJHRhcmdldCB8fCAhdGhpcy5fJHRhcmdldC5sZW5ndGgpICYmIHRoaXMuX2FuaW1hdGlvbiAhPT0gJ25vbmUnKSByZXR1cm47IC8vaWYgc3RpbGwgbm8gdGFyZ2V0IHN0b3AgaW5pdCBmdW5jXHJcblxyXG4gICAgICB0aGlzLmJpbmRIYW5kbGVycygpO1xyXG4gICAgICB0aGlzLmF0dGFjaEhhbmRsZXJzKCk7XHJcblxyXG4gICAgICBpZiAodGhpcy5fYW5pbWF0aW9uICE9PSAnbm9uZScpIHsgLy8g0LLQvtC30LzQvtC20L3QviDQu9C40YjQvdC10LUg0YPRgdC70L7QstC40LVcclxuICAgICAgICB0aGlzLl8kdGFyZ2V0LmhpZGUoKTtcclxuICAgICAgfVxyXG5cclxuICAgICAgaWYgKHRoaXMuXyR0b2dnbGVyQnRuLmhhc0NsYXNzKHRoaXMuY2xhc3NOYW1lLmFjdGl2ZSkpIHtcclxuICAgICAgICB0aGlzLnNob3dFbCgnc2ltcGxlJyk7XHJcbiAgICAgICAgdGhpcy5faXNBY3RpdmUgPSB0cnVlO1xyXG4gICAgICB9XHJcblxyXG4gICAgICB0aGlzLl9pc1dvcmtpbmcgPSB0cnVlO1xyXG4gICAgICB0aGlzLl9pc0luaXRlZCA9IHRydWU7XHJcbiAgICB9XHJcblxyXG4gICAgYmluZEVsZW1lbnRzKCkge1xyXG4gICAgICB0aGlzLl8kdG9nZ2xlckJ0biA9ICQodGhpcy5fdG9nZ2xlckJ0bik7XHJcbiAgICAgIHRoaXMuXyRsaXN0ZW5lZEVsID0gJCh0aGlzLl9saXN0ZW5lZEVsKTtcclxuICAgICAgdGhpcy5fZ3JvdXBOYW1lID0gdGhpcy5fZ3JvdXBOYW1lIHx8IHRoaXMuXyR0b2dnbGVyQnRuLmF0dHIoJ2RhdGEtZXQtZ3JvdXAnKTtcclxuXHJcbiAgICAgIGlmICh0eXBlb2YgdGhpcy5fZ2V0VGFyZ2V0ID09PSAnZnVuY3Rpb24nKSB7XHJcbiAgICAgICAgdGhpcy5fJHRhcmdldCA9ICQodGhpcy5fZ2V0VGFyZ2V0KHRoaXMuXyR0b2dnbGVyQnRuLCB0aGlzKSk7XHJcbiAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgdGhpcy5fdGFyZ2V0U2VsZWN0b3IgPSB0aGlzLl90YXJnZXRTZWxlY3RvciB8fCB0aGlzLl8kdG9nZ2xlckJ0bi5hdHRyKCdkYXRhLWV0LXRhcmdldCcpIHx8IHRoaXMuXyR0b2dnbGVyQnRuLmF0dHIoJ2hyZWYnKTtcclxuICAgICAgICB0aGlzLl8kdGFyZ2V0ID0gJCh0aGlzLl90YXJnZXRTZWxlY3Rvcik7XHJcbiAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICBiaW5kSGFuZGxlcnMoKSB7XHJcbiAgICAgIGxldCBtYXhBbmltYXRpb25EdXJhdGlvbiA9IHRoaXMuX29wZW5BbmltYXRpb25EdXJhdGlvbiA+PSB0aGlzLl9jbG9zZUFuaW1hdGlvbkR1cmF0aW9uID8gdGhpcy5fb3BlbkFuaW1hdGlvbkR1cmF0aW9uOiB0aGlzLl9jbG9zZUFuaW1hdGlvbkR1cmF0aW9uO1xyXG5cclxuICAgICAgdGhpcy5fZGVib3VuY2VkVG9nZ2xlckhhbmRsZXIgPSB0aGlzLmRlYm91bmNlKHRoaXMudG9nZ2xlckhhbmRsZXIsIG1heEFuaW1hdGlvbkR1cmF0aW9uICsgNSwgdGhpcyk7XHJcbiAgICAgIHRoaXMuX29wZW5CbG9ja0xpc3RlbmVyID0gdGhpcy5vcGVuQmxvY2tMaXN0ZW5lci5iaW5kKHRoaXMpO1xyXG4gICAgICB0aGlzLl9vcGVuR3JvdXBIYW5kbGVyID0gdGhpcy5zd2l0Y2hIYW5kbGVyLmJpbmQodGhpcyk7XHJcbiAgICAgIHRoaXMuX2Nsb3NlR3JvdXBIYW5kbGVyID0gdGhpcy5jbG9zZUdyb3VwSGFuZGxlci5iaW5kKHRoaXMpO1xyXG4gICAgICB0aGlzLl9jbG9zZUJ0bkxpc3RlbmVyID0gdGhpcy5jbG9zZUJ0bkxpc3RlbmVyLmJpbmQodGhpcyk7XHJcbiAgICAgIHRoaXMuX291dGVyQ2xpY2tMaXN0ZW5lciA9IHRoaXMub3V0ZXJDbGlja0xpc3RlbmVyLmJpbmQodGhpcyk7XHJcbiAgICAgIHRoaXMuX29wZW5FbEhhbmRsZXIgPSB0aGlzLm9wZW5FbEhhbmRsZXIuYmluZCh0aGlzKTtcclxuICAgICAgdGhpcy5fY2xvc2VFbEhhbmRsZXIgPSB0aGlzLmNsb3NlRWxIYW5kbGVyLmJpbmQodGhpcyk7XHJcbiAgICAgIHRoaXMuX3N0YXJ0SGFuZGxlciA9IHRoaXMuc3RhcnRIYW5kbGVyLmJpbmQodGhpcyk7XHJcbiAgICAgIHRoaXMuX3N0b3BIYW5kbGVyID0gdGhpcy5zdG9wSGFuZGxlci5iaW5kKHRoaXMpO1xyXG4gICAgfVxyXG5cclxuICAgIGF0dGFjaEhhbmRsZXJzKCkge1xyXG4gICAgICBsZXQgY2xpY2tFdmVudCA9IHRoaXMuX2NsaWNrRXZlbnQgPSB0aGlzLmlzSU9TKCkgPyAndG91Y2hzdGFydCcgOiAnY2xpY2snO1xyXG4gICAgICBsZXQgJGxpc3RlbmVkRWwgPSB0aGlzLl8kbGlzdGVuZWRFbDtcclxuICAgICAgbGV0ICR0YXJnZXQgPSB0aGlzLl8kdGFyZ2V0O1xyXG5cclxuICAgICAgaWYgKCR0YXJnZXQubGVuZ3RoKSB7XHJcbiAgICAgICAgJHRhcmdldFxyXG4gICAgICAgICAgLm9uKCdjbGljaycsIHRoaXMuX2Nsb3NlQnRuTGlzdGVuZXIpXHJcbiAgICAgICAgICAuYWRkQ2xhc3ModGhpcy5jbGFzc05hbWUuaW5pdGlhbGl6ZWRUYXJnZXQpO1xyXG4gICAgICB9XHJcblxyXG4gICAgICBpZiAodGhpcy5fb3V0ZXJDbGlja0Nsb3NlKSB7XHJcbiAgICAgICAgJGxpc3RlbmVkRWwub24odGhpcy5fY2xpY2tFdmVudCwgdGhpcy5fb3V0ZXJDbGlja0xpc3RlbmVyKTtcclxuICAgICAgfVxyXG5cclxuICAgICAgaWYgKHRoaXMuX2dyb3VwTmFtZSkge1xyXG4gICAgICAgICRsaXN0ZW5lZEVsLm9uKHtcclxuICAgICAgICAgIFt0aGlzLmV2ZW50cy5iZWZvcmVPcGVuXTogdGhpcy5fb3BlbkJsb2NrTGlzdGVuZXIsXHJcbiAgICAgICAgICBbdGhpcy5ldmVudHMub3Blbkdyb3VwXTogdGhpcy5fb3Blbkdyb3VwSGFuZGxlcixcclxuICAgICAgICAgIFt0aGlzLmV2ZW50cy5jbG9zZUdyb3VwXTogdGhpcy5fY2xvc2VHcm91cEhhbmRsZXJcclxuICAgICAgICB9KTtcclxuICAgICAgfVxyXG5cclxuICAgICAgdGhpcy5fJHRvZ2dsZXJCdG5cclxuICAgICAgICAub24oe1xyXG4gICAgICAgICAgW2NsaWNrRXZlbnRdOiB0aGlzLl9kZWJvdW5jZWRUb2dnbGVySGFuZGxlcixcclxuICAgICAgICAgIFt0aGlzLmV2ZW50cy5vcGVuXTogdGhpcy5fb3BlbkVsSGFuZGxlcixcclxuICAgICAgICAgIFt0aGlzLmV2ZW50cy5jbG9zZV06IHRoaXMuX2Nsb3NlRWxIYW5kbGVyLFxyXG4gICAgICAgICAgW3RoaXMuZXZlbnRzLnN0b3BdOiB0aGlzLl9zdG9wSGFuZGxlclxyXG4gICAgICAgIH0pXHJcbiAgICAgICAgLmFkZENsYXNzKHRoaXMuY2xhc3NOYW1lLmluaXRpYWxpemVkVG9nZ2xlcik7XHJcblxyXG4gICAgICBpZiAoIXRoaXMuX2lzSW5pdGVkKSB7XHJcbiAgICAgICAgdGhpcy5fJHRvZ2dsZXJCdG5cclxuICAgICAgICAgIC5vbih7XHJcbiAgICAgICAgICAgIFt0aGlzLmV2ZW50cy5zdGFydF06IHRoaXMuX3N0YXJ0SGFuZGxlclxyXG4gICAgICAgICAgfSk7XHJcbiAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICBkZXRhY2hIYW5kbGVycygpIHtcclxuICAgICAgbGV0IGNsaWNrRXZlbnQgPSB0aGlzLl9jbGlja0V2ZW50ID0gdGhpcy5pc0lPUygpID8gJ3RvdWNoc3RhcnQnIDogJ2NsaWNrJztcclxuICAgICAgbGV0ICRsaXN0ZW5lZEVsID0gdGhpcy5fJGxpc3RlbmVkRWw7XHJcbiAgICAgIGxldCAkdGFyZ2V0ID0gdGhpcy5fJHRhcmdldDtcclxuXHJcbiAgICAgIGlmICgkdGFyZ2V0Lmxlbmd0aCkge1xyXG4gICAgICAgICR0YXJnZXRcclxuICAgICAgICAgIC5vZmYoJ2NsaWNrJywgdGhpcy5fY2xvc2VCdG5MaXN0ZW5lcilcclxuICAgICAgICAgIC5yZW1vdmVDbGFzcyh0aGlzLmNsYXNzTmFtZS5pbml0aWFsaXplZFRhcmdldCk7XHJcbiAgICAgIH1cclxuXHJcbiAgICAgIGlmICh0aGlzLl9vdXRlckNsaWNrQ2xvc2UpIHtcclxuICAgICAgICAkbGlzdGVuZWRFbC5vZmYodGhpcy5fY2xpY2tFdmVudCwgdGhpcy5fb3V0ZXJDbGlja0xpc3RlbmVyKTtcclxuICAgICAgfVxyXG5cclxuICAgICAgaWYgKHRoaXMuX2dyb3VwTmFtZSkge1xyXG4gICAgICAgICRsaXN0ZW5lZEVsLm9mZih7XHJcbiAgICAgICAgICBbdGhpcy5ldmVudHMuYmVmb3JlT3Blbl06IHRoaXMuX29wZW5CbG9ja0xpc3RlbmVyLFxyXG4gICAgICAgICAgW3RoaXMuZXZlbnRzLmNsb3NlR3JvdXBdOiB0aGlzLl9jbG9zZUdyb3VwSGFuZGxlclxyXG4gICAgICAgIH0pO1xyXG4gICAgICB9XHJcblxyXG4gICAgICB0aGlzLl8kdG9nZ2xlckJ0blxyXG4gICAgICAgIC5vZmYoe1xyXG4gICAgICAgICAgW2NsaWNrRXZlbnRdOiB0aGlzLl9kZWJvdW5jZWRUb2dnbGVySGFuZGxlcixcclxuICAgICAgICAgIFt0aGlzLmV2ZW50cy5vcGVuXTogdGhpcy5fb3BlbkVsSGFuZGxlcixcclxuICAgICAgICAgIFt0aGlzLmV2ZW50cy5jbG9zZV06IHRoaXMuX2Nsb3NlRWxIYW5kbGVyLFxyXG4gICAgICAgICAgW3RoaXMuZXZlbnRzLnN0b3BdOiB0aGlzLl9zdG9wSGFuZGxlclxyXG4gICAgICAgIH0pXHJcbiAgICAgICAgLnJlbW92ZUNsYXNzKHRoaXMuY2xhc3NOYW1lLmluaXRpYWxpemVkVG9nZ2xlcik7XHJcbiAgICB9XHJcblxyXG4gICAgc3RhcnQoKSB7XHJcbiAgICAgIGlmICh0aGlzLl9pc1dvcmtpbmcpIHJldHVybjtcclxuXHJcbiAgICAgIHRoaXMuYXR0YWNoSGFuZGxlcnMoKTtcclxuICAgICAgdGhpcy5faXNXb3JraW5nID0gdHJ1ZTtcclxuICAgIH1cclxuXHJcbiAgICBzdG9wKCkge1xyXG4gICAgICBpZiAoIXRoaXMuX2lzV29ya2luZykgcmV0dXJuO1xyXG5cclxuICAgICAgdGhpcy5kZXRhY2hIYW5kbGVycygpO1xyXG4gICAgICB0aGlzLl9pc1dvcmtpbmcgPSBmYWxzZTtcclxuICAgIH1cclxuXHJcbiAgICBzdGFydEhhbmRsZXIoZSkge1xyXG4gICAgICBsZXQgZWwgPSBlLnRhcmdldDtcclxuXHJcbiAgICAgIGlmICghdGhpcy5pc1NhbWVUb2dnbGVyKGVsKSkgcmV0dXJuO1xyXG5cclxuICAgICAgdGhpcy5zdGFydCgpO1xyXG4gICAgfVxyXG5cclxuICAgIHN0b3BIYW5kbGVyKGUpIHtcclxuICAgICAgbGV0IGVsID0gZS50YXJnZXQ7XHJcblxyXG4gICAgICBpZiAoIXRoaXMuaXNTYW1lVG9nZ2xlcihlbCkpIHJldHVybjtcclxuXHJcbiAgICAgIHRoaXMuc3RvcCgpO1xyXG4gICAgfVxyXG5cclxuICAgIGlzU2FtZVRvZ2dsZXIoZWwpIHtcclxuICAgICAgLy9sZXQgJGVsID0gJChlbCk7XHJcbiAgICAgIC8vbGV0ICRjbG9zZXN0VG9nZ2xlckJ0biA9ICRlbC5jbG9zZXN0KCcuJyArIHRoaXMuY2xhc3NOYW1lLmluaXRpYWxpemVkVG9nZ2xlcik7XHJcblxyXG4gICAgICByZXR1cm4gdGhpcy5fJHRvZ2dsZXJCdG4uaXMoZWwpO1xyXG4gICAgfVxyXG5cclxuICAgIHRvZ2dsZXJIYW5kbGVyKGUpIHtcclxuICAgICAgbGV0ICRlbCA9ICQoZS50YXJnZXQpO1xyXG4gICAgICBsZXQgaXNUYXJnZXQgPSAhISRlbC5jbG9zZXN0KHRoaXMuXyR0YXJnZXQpLmxlbmd0aCAmJiAhJGVsLmlzKHRoaXMuXyR0b2dnbGVyQnRuKTtcclxuXHJcbiAgICAgIGlmICghdGhpcy5pc0hpZGRlbih0aGlzLl8kdGFyZ2V0KSAmJiB0aGlzLl9hbmltYXRpb24gIT09ICdub25lJykgeyAvL9Cy0L7Qt9C80L7QttC90L4g0YHRgtC+0LjRgiDRgtCw0LrQttC1INGD0LTQsNC70LjRgtGMXHJcbiAgICAgICAgdGhpcy5faXNBY3RpdmUgPSB0cnVlO1xyXG4gICAgICB9XHJcblxyXG4gICAgICBpZiAodGhpcy5faXNBY3RpdmUgJiYgaXNUYXJnZXQpIHJldHVybjtcclxuXHJcbiAgICAgIGUucHJldmVudERlZmF1bHQoKTtcclxuXHJcbiAgICAgIGlmICh0aGlzLl9pc0FjdGl2ZSkge1xyXG4gICAgICAgIHRoaXMuaGlkZUVsKCk7XHJcbiAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgdGhpcy5zaG93RWwoKTtcclxuICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIG9wZW5FbEhhbmRsZXIoZSwgYW5pbWF0aW9uLCBkdXJhdGlvbiwgY2FsbGJhY2spIHtcclxuICAgICAgbGV0IGVsID0gZS50YXJnZXQ7XHJcblxyXG4gICAgICBpZiAoIXRoaXMuaXNTYW1lVG9nZ2xlcihlbCkpIHJldHVybjtcclxuXHJcbiAgICAgIHRoaXMuc2hvd0VsKGFuaW1hdGlvbiwgZHVyYXRpb24sIGNhbGxiYWNrKTtcclxuICAgIH1cclxuXHJcbiAgICBjbG9zZUVsSGFuZGxlcihlLCBhbmltYXRpb24sIGR1cmF0aW9uLCBjYWxsYmFjaykge1xyXG4gICAgICBsZXQgZWwgPSBlLnRhcmdldDtcclxuXHJcbiAgICAgIGlmICghdGhpcy5pc1NhbWVUb2dnbGVyKGVsKSkgcmV0dXJuO1xyXG5cclxuICAgICAgdGhpcy5oaWRlRWwoYW5pbWF0aW9uLCBkdXJhdGlvbiwgY2FsbGJhY2spO1xyXG4gICAgfVxyXG5cclxuICAgIG9wZW5CbG9ja0xpc3RlbmVyKGUsIGNvbnRyb2xsZXIpIHtcclxuICAgICAgaWYgKCF0aGlzLl9pc0FjdGl2ZSB8fFxyXG4gICAgICAgIGNvbnRyb2xsZXIuXyR0b2dnbGVyQnRuLmlzKHRoaXMuXyR0b2dnbGVyQnRuKSB8fFxyXG4gICAgICAgIGNvbnRyb2xsZXIuX2dyb3VwTmFtZSAhPT0gdGhpcy5fZ3JvdXBOYW1lIHx8XHJcbiAgICAgICAgY29udHJvbGxlci5fZ3JvdXBOYW1lID09PSB1bmRlZmluZWQpIHtcclxuICAgICAgICByZXR1cm47XHJcbiAgICAgIH1cclxuXHJcbiAgICAgIHRoaXMuc3dpdGNoRWwoKTtcclxuICAgIH1cclxuXHJcbiAgICBzd2l0Y2hIYW5kbGVyKGUsIGdyb3VwTmFtZSkge1xyXG4gICAgICBpZiAoZ3JvdXBOYW1lICE9PSB0aGlzLl9ncm91cE5hbWUgfHxcclxuICAgICAgICBncm91cE5hbWUgPT09IHVuZGVmaW5lZCkge1xyXG4gICAgICAgIHJldHVybjtcclxuICAgICAgfVxyXG5cclxuICAgICAgdGhpcy5zd2l0Y2hFbCgpO1xyXG4gICAgfVxyXG5cclxuICAgIGNsb3NlR3JvdXBIYW5kbGVyKGUsIGdyb3VwTmFtZSkge1xyXG4gICAgICBpZiAoIXRoaXMuX2lzQWN0aXZlIHx8XHJcbiAgICAgICAgZ3JvdXBOYW1lICE9PSB0aGlzLl9ncm91cE5hbWUgfHxcclxuICAgICAgICBncm91cE5hbWUgPT09IHVuZGVmaW5lZCkge1xyXG4gICAgICAgIHJldHVybjtcclxuICAgICAgfVxyXG5cclxuICAgICAgdGhpcy5oaWRlRWwoKTtcclxuICAgIH1cclxuXHJcbiAgICBvdXRlckNsaWNrTGlzdGVuZXIoZSkge1xyXG4gICAgICAvL2NvbnNvbGUuZGlyKHRoaXMpO1xyXG4gICAgICBpZiAoIXRoaXMuX2lzQWN0aXZlKSByZXR1cm47XHJcblxyXG4gICAgICBsZXQgJGVsID0gJChlLnRhcmdldCk7XHJcbiAgICAgIGxldCBpc091dGVyID0gISRlbC5jbG9zZXN0KHRoaXMuXyR0YXJnZXQuYWRkKHRoaXMuXyR0b2dnbGVyQnRuKSkubGVuZ3RoO1xyXG5cclxuICAgICAgaWYgKCFpc091dGVyKSByZXR1cm47XHJcblxyXG4gICAgICB0aGlzLmhpZGVFbCgpO1xyXG4gICAgfVxyXG5cclxuICAgIGNsb3NlQnRuTGlzdGVuZXIoZSkge1xyXG4gICAgICBsZXQgJGVsID0gJChlLnRhcmdldCk7XHJcbiAgICAgIGxldCAkY2xvc2VCdG4gPSAkZWwuY2xvc2VzdCh0aGlzLl9jbG9zZUJ0blNlbGVjdG9yKTtcclxuXHJcbiAgICAgIGlmICghJGNsb3NlQnRuLmxlbmd0aCkgcmV0dXJuO1xyXG5cclxuICAgICAgbGV0ICRjdXJyVGFyZ2V0ID0gJGNsb3NlQnRuLmNsb3Nlc3QoJy4nICsgdGhpcy5jbGFzc05hbWUuaW5pdGlhbGl6ZWRUYXJnZXQpO1xyXG5cclxuICAgICAgaWYgKCEkY3VyclRhcmdldC5pcyh0aGlzLl8kdGFyZ2V0KSkgcmV0dXJuO1xyXG5cclxuICAgICAgdGhpcy5oaWRlRWwoKTtcclxuICAgIH1cclxuXHJcbiAgICBzaG93RWwoYW5pbWF0aW9uLCBkdXJhdGlvbiwgY2FsbGJhY2spIHtcclxuICAgICAgaWYgKH50aGlzLl9kaXNhbGxvd2VkQWN0aW9ucy5pbmRleE9mKHRoaXMuYWN0aW9ucy5vcGVuKSkgcmV0dXJuO1xyXG5cclxuICAgICAgbGV0ICR0YXJnZXQgPSB0aGlzLl8kdGFyZ2V0O1xyXG4gICAgICBjYWxsYmFjayA9IHR5cGVvZiBjYWxsYmFjayA9PT0gJ2Z1bmN0aW9uJyA/IGNhbGxiYWNrLmJpbmQodGhpcykgOiB0aGlzLnNob3dDYWxsYmFjay5iaW5kKHRoaXMpO1xyXG4gICAgICBkdXJhdGlvbiA9IGR1cmF0aW9uIHx8IHRoaXMuX29wZW5BbmltYXRpb25EdXJhdGlvbjtcclxuICAgICAgYW5pbWF0aW9uID0gYW5pbWF0aW9uIHx8IHRoaXMuX29wZW5BbmltYXRpb247XHJcblxyXG4gICAgICB0aGlzLl8kdG9nZ2xlckJ0bi5hZGRDbGFzcyh0aGlzLmNsYXNzTmFtZS5hY3RpdmUpO1xyXG4gICAgICAkdGFyZ2V0LmFkZENsYXNzKHRoaXMuY2xhc3NOYW1lLmFjdGl2ZSk7XHJcbiAgICAgIHRoaXMuX2lzQWN0aXZlID0gdHJ1ZTtcclxuXHJcbiAgICAgIGlmICh0eXBlb2YgdGhpcy5fb25CZWZvcmVPcGVuID09PSAnZnVuY3Rpb24nKSB7XHJcbiAgICAgICAgdGhpcy5fb25CZWZvcmVPcGVuKHRoaXMpO1xyXG4gICAgICB9XHJcblxyXG4gICAgICB0aGlzLl8kdG9nZ2xlckJ0bi50cmlnZ2VyKHRoaXMuZXZlbnRzLmJlZm9yZU9wZW4sIFt0aGlzXSk7XHJcblxyXG4gICAgICBzd2l0Y2ggKGFuaW1hdGlvbikge1xyXG4gICAgICAgIGNhc2UgJ25vbmUnOlxyXG4gICAgICAgICAgY2FsbGJhY2soKTtcclxuICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgIGNhc2UgJ3NpbXBsZSc6XHJcbiAgICAgICAgICAkdGFyZ2V0LnNob3coKTtcclxuICAgICAgICAgIGNhbGxiYWNrKCk7XHJcbiAgICAgICAgICBicmVhaztcclxuICAgICAgICBjYXNlICdzbGlkZSc6XHJcbiAgICAgICAgICBpZiAoISR0YXJnZXQubGVuZ3RoKSB7XHJcbiAgICAgICAgICAgIGNhbGxiYWNrKCk7XHJcbiAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAkdGFyZ2V0LnNsaWRlRG93bihkdXJhdGlvbiwgY2FsbGJhY2spO1xyXG4gICAgICAgICAgfVxyXG4gICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgY2FzZSAnZmFkZSc6XHJcbiAgICAgICAgICBpZiAoISR0YXJnZXQubGVuZ3RoKSB7XHJcbiAgICAgICAgICAgIGNhbGxiYWNrKCk7XHJcbiAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAkdGFyZ2V0LmZhZGVJbihkdXJhdGlvbiwgY2FsbGJhY2spO1xyXG4gICAgICAgICAgfVxyXG4gICAgICAgICAgYnJlYWs7XHJcbiAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICBzaG93Q2FsbGJhY2soKSB7XHJcbiAgICAgIGlmICh0eXBlb2YgdGhpcy5fb25BZnRlck9wZW4gPT09ICdmdW5jdGlvbicpIHtcclxuICAgICAgICB0aGlzLl9vbkFmdGVyT3Blbih0aGlzKTtcclxuICAgICAgfVxyXG5cclxuICAgICAgdGhpcy5fJHRvZ2dsZXJCdG4udHJpZ2dlcih0aGlzLmV2ZW50cy5hZnRlck9wZW4sIFt0aGlzXSk7XHJcblxyXG4gICAgICBpZiAodGhpcy5fb3V0ZXJDbGlja0Nsb3NlKSB7XHJcbiAgICAgICAgdGhpcy5fJGxpc3RlbmVkRWwub24odGhpcy5fY2xpY2tFdmVudCwgdGhpcy5vdXRlckNsaWNrTGlzdGVuZXIpO1xyXG4gICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgaGlkZUVsKGFuaW1hdGlvbiwgZHVyYXRpb24sIGNhbGxiYWNrKSB7XHJcbiAgICAgIGlmICh+dGhpcy5fZGlzYWxsb3dlZEFjdGlvbnMuaW5kZXhPZih0aGlzLmFjdGlvbnMuY2xvc2UpKSByZXR1cm47XHJcblxyXG4gICAgICBsZXQgJHRhcmdldCA9IHRoaXMuXyR0YXJnZXQ7XHJcbiAgICAgIGNhbGxiYWNrID0gdHlwZW9mIGNhbGxiYWNrID09PSAnZnVuY3Rpb24nID8gY2FsbGJhY2suYmluZCh0aGlzKSA6IHRoaXMuaGlkZUNhbGxiYWNrLmJpbmQodGhpcyk7XHJcbiAgICAgIGR1cmF0aW9uID0gZHVyYXRpb24gfHwgdGhpcy5fY2xvc2VBbmltYXRpb25EdXJhdGlvbjtcclxuICAgICAgYW5pbWF0aW9uID0gYW5pbWF0aW9uIHx8IHRoaXMuX2Nsb3NlQW5pbWF0aW9uO1xyXG5cclxuICAgICAgdGhpcy5fJHRvZ2dsZXJCdG4ucmVtb3ZlQ2xhc3ModGhpcy5jbGFzc05hbWUuYWN0aXZlKTtcclxuICAgICAgJHRhcmdldC5yZW1vdmVDbGFzcyh0aGlzLmNsYXNzTmFtZS5hY3RpdmUpO1xyXG4gICAgICB0aGlzLl9pc0FjdGl2ZSA9IGZhbHNlO1xyXG5cclxuICAgICAgaWYgKHR5cGVvZiB0aGlzLl9vbkJlZm9yZUNsb3NlID09PSAnZnVuY3Rpb24nKSB7XHJcbiAgICAgICAgdGhpcy5fb25CZWZvcmVDbG9zZSh0aGlzKTtcclxuICAgICAgfVxyXG5cclxuICAgICAgdGhpcy5fJHRvZ2dsZXJCdG4udHJpZ2dlcih0aGlzLmV2ZW50cy5iZWZvcmVDbG9zZSwgW3RoaXNdKTtcclxuXHJcbiAgICAgIHN3aXRjaCAoYW5pbWF0aW9uKSB7XHJcbiAgICAgICAgY2FzZSAnbm9uZSc6XHJcbiAgICAgICAgICBjYWxsYmFjaygpO1xyXG4gICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgY2FzZSAnc2ltcGxlJzpcclxuICAgICAgICAgICR0YXJnZXQuaGlkZSgpO1xyXG4gICAgICAgICAgY2FsbGJhY2soKTtcclxuICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgIGNhc2UgJ3NsaWRlJzpcclxuICAgICAgICAgICR0YXJnZXQuc2xpZGVVcChkdXJhdGlvbiwgY2FsbGJhY2spO1xyXG4gICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgY2FzZSAnZmFkZSc6XHJcbiAgICAgICAgICAkdGFyZ2V0LmZhZGVPdXQoZHVyYXRpb24sIGNhbGxiYWNrKTtcclxuICAgICAgICAgIGJyZWFrO1xyXG4gICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgaGlkZUNhbGxiYWNrKCkge1xyXG4gICAgICBpZiAodHlwZW9mIHRoaXMuX29uQWZ0ZXJDbG9zZSA9PT0gJ2Z1bmN0aW9uJykge1xyXG4gICAgICAgIHRoaXMuX29uQWZ0ZXJDbG9zZSh0aGlzKTtcclxuICAgICAgfVxyXG5cclxuICAgICAgdGhpcy5fJHRvZ2dsZXJCdG4udHJpZ2dlcih0aGlzLmV2ZW50cy5hZnRlckNsb3NlLCBbdGhpc10pO1xyXG5cclxuICAgICAgaWYgKHRoaXMuX291dGVyQ2xpY2tDbG9zZSkge1xyXG4gICAgICAgIHRoaXMuXyRsaXN0ZW5lZEVsLm9mZih0aGlzLl9jbGlja0V2ZW50LCB0aGlzLm91dGVyQ2xpY2tMaXN0ZW5lcik7XHJcbiAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICBzd2l0Y2hFbChhbmltYXRpb24sIGR1cmF0aW9uLCBjYWxsYmFjaykge1xyXG4gICAgICBpZiAofnRoaXMuX2Rpc2FsbG93ZWRBY3Rpb25zLmluZGV4T2YodGhpcy5hY3Rpb25zLnN3aXRjaCkpIHJldHVybjtcclxuXHJcbiAgICAgIGxldCAkdGFyZ2V0ID0gdGhpcy5fJHRhcmdldDtcclxuICAgICAgY2FsbGJhY2sgPSB0eXBlb2YgY2FsbGJhY2sgPT09ICdmdW5jdGlvbicgPyBjYWxsYmFjay5iaW5kKHRoaXMpIDogdGhpcy5zd2l0Y2hDYWxsYmFjay5iaW5kKHRoaXMpO1xyXG4gICAgICBkdXJhdGlvbiA9IGR1cmF0aW9uIHx8IHRoaXMuX3N3aXRjaEFuaW1hdGlvbkR1cmF0aW9uO1xyXG4gICAgICBhbmltYXRpb24gPSBhbmltYXRpb24gfHwgdGhpcy5fc3dpdGNoQW5pbWF0aW9uO1xyXG5cclxuICAgICAgdGhpcy5fJHRvZ2dsZXJCdG4ucmVtb3ZlQ2xhc3ModGhpcy5jbGFzc05hbWUuYWN0aXZlKTtcclxuICAgICAgJHRhcmdldC5yZW1vdmVDbGFzcyh0aGlzLmNsYXNzTmFtZS5hY3RpdmUpO1xyXG4gICAgICB0aGlzLl9pc0FjdGl2ZSA9IGZhbHNlO1xyXG5cclxuICAgICAgaWYgKHR5cGVvZiB0aGlzLl9vbkJlZm9yZVN3aXRjaCA9PT0gJ2Z1bmN0aW9uJykge1xyXG4gICAgICAgIHRoaXMuX29uQmVmb3JlU3dpdGNoKHRoaXMpO1xyXG4gICAgICB9XHJcblxyXG4gICAgICB0aGlzLl8kdG9nZ2xlckJ0bi50cmlnZ2VyKHRoaXMuZXZlbnRzLmJlZm9yZVN3aXRjaCwgW3RoaXNdKTtcclxuXHJcbiAgICAgIHN3aXRjaCAoYW5pbWF0aW9uKSB7XHJcbiAgICAgICAgY2FzZSAnbm9uZSc6XHJcbiAgICAgICAgICBjYWxsYmFjaygpO1xyXG4gICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgY2FzZSAnc2ltcGxlJzpcclxuICAgICAgICAgICR0YXJnZXQuaGlkZSgpO1xyXG4gICAgICAgICAgY2FsbGJhY2soKTtcclxuICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgIGNhc2UgJ3NsaWRlJzpcclxuICAgICAgICAgICR0YXJnZXQuc2xpZGVVcChkdXJhdGlvbiwgY2FsbGJhY2spO1xyXG4gICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgY2FzZSAnZmFkZSc6XHJcbiAgICAgICAgICAkdGFyZ2V0LmZhZGVPdXQoZHVyYXRpb24sIGNhbGxiYWNrKTtcclxuICAgICAgICAgIGJyZWFrO1xyXG4gICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgc3dpdGNoQ2FsbGJhY2soKSB7XHJcbiAgICAgIGlmICh0eXBlb2YgdGhpcy5fb25BZnRlckNsb3NlID09PSAnZnVuY3Rpb24nKSB7XHJcbiAgICAgICAgdGhpcy5fb25BZnRlclN3aXRjaCh0aGlzKTtcclxuICAgICAgfVxyXG5cclxuICAgICAgdGhpcy5fJHRvZ2dsZXJCdG4udHJpZ2dlcih0aGlzLmV2ZW50cy5hZnRlclN3aXRjaCwgW3RoaXNdKTtcclxuXHJcbiAgICAgIGlmICh0aGlzLl9vdXRlckNsaWNrQ2xvc2UpIHtcclxuICAgICAgICB0aGlzLl8kbGlzdGVuZWRFbC5vZmYodGhpcy5fY2xpY2tFdmVudCwgdGhpcy5vdXRlckNsaWNrTGlzdGVuZXIpO1xyXG4gICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgaXNJT1MoKSB7XHJcbiAgICAgIHJldHVybiAvaVBhZHxpUGhvbmV8aVBvZC8udGVzdChuYXZpZ2F0b3IudXNlckFnZW50KSAmJiAhd2luZG93Lk1TU3RyZWFtO1xyXG4gICAgfVxyXG5cclxuICAgIGlzSGlkZGVuKGVsKSB7XHJcbiAgICAgIGxldCAkZWwgPSAkKGVsKTtcclxuXHJcbiAgICAgIHJldHVybiAkZWwuaXMoJzpoaWRkZW4nKSB8fFxyXG4gICAgICAgICRlbC5jc3MoJ3Zpc2liaWxpdHknKSA9PT0gJ2hpZGRlbicgfHxcclxuICAgICAgICArJGVsLmNzcygnb3BhY2l0eScpID09PSAwO1xyXG4gICAgfVxyXG5cclxuICAgIGdldFNlbGYoKSB7XHJcbiAgICAgIHJldHVybiB0aGlzO1xyXG4gICAgfVxyXG5cclxuICAgIC8qKlxyXG4gICAgICogRGVib3VuY2VzIGEgZnVuY3Rpb24uIFJldHVybnMgYSBmdW5jdGlvbiB0aGF0IGNhbGxzIHRoZSBvcmlnaW5hbCBmbiBmdW5jdGlvbiBvbmx5IGlmIG5vIGludm9jYXRpb25zIGhhdmUgYmVlbiBtYWRlXHJcbiAgICAgKiB3aXRoaW4gdGhlIGxhc3QgcXVpZXRNaWxsaXMgbWlsbGlzZWNvbmRzLlxyXG4gICAgICpcclxuICAgICAqIEBwYXJhbSBxdWlldE1pbGxpcyBudW1iZXIgb2YgbWlsbGlzZWNvbmRzIHRvIHdhaXQgYmVmb3JlIGludm9raW5nIGZuXHJcbiAgICAgKiBAcGFyYW0gZm4gZnVuY3Rpb24gdG8gYmUgZGVib3VuY2VkXHJcbiAgICAgKiBAcGFyYW0gYmluZGVkVGhpcyBvYmplY3QgdG8gYmUgdXNlZCBhcyB0aGlzIHJlZmVyZW5jZSB3aXRoaW4gZm5cclxuICAgICAqIEByZXR1cm4gZGVib3VuY2VkIHZlcnNpb24gb2YgZm5cclxuICAgICAqL1xyXG4gICAgZGVib3VuY2UoZm4sIHF1aWV0TWlsbGlzLCBiaW5kZWRUaGlzKSB7XHJcbiAgICAgIGxldCBpc1dhaXRpbmcgPSBmYWxzZTtcclxuICAgICAgcmV0dXJuIGZ1bmN0aW9uIGZ1bmMoKSB7XHJcbiAgICAgICAgaWYgKGlzV2FpdGluZykgcmV0dXJuO1xyXG5cclxuICAgICAgICBpZiAoYmluZGVkVGhpcyA9PT0gdW5kZWZpbmVkKSB7XHJcbiAgICAgICAgICBiaW5kZWRUaGlzID0gdGhpcztcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGZuLmFwcGx5KGJpbmRlZFRoaXMsIGFyZ3VtZW50cyk7XHJcbiAgICAgICAgaXNXYWl0aW5nID0gdHJ1ZTtcclxuXHJcbiAgICAgICAgc2V0VGltZW91dChmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICBpc1dhaXRpbmcgPSBmYWxzZTtcclxuICAgICAgICB9LCBxdWlldE1pbGxpcyk7XHJcbiAgICAgIH07XHJcbiAgICB9XHJcblxyXG4gICAgc2V0T3B0aW9ucyhvcHRpb25zKSB7XHJcbiAgICAgIHRoaXMuZGV0YWNoSGFuZGxlcnMoKTtcclxuXHJcbiAgICAgIGZvciAobGV0IGtleSBpbiBvcHRpb25zKSB7XHJcbiAgICAgICAgdGhpc1snXycgKyBrZXldID0gb3B0aW9uc1trZXldO1xyXG4gICAgICB9XHJcblxyXG4gICAgICB0aGlzLmluaXQoKTtcclxuICAgIH1cclxuICB9XHJcblxyXG4gIGNsYXNzIERlbGVnYXRlZFRvZ2dsZXJDb250cm9sbGVyIHtcclxuICAgIGNvbnN0cnVjdG9yKG9wdGlvbnMpIHtcclxuICAgICAgdGhpcy5fJGRlbGVnYXRlZENvbnRhaW5lciA9IG9wdGlvbnMuJGRlbGVnYXRlZENvbnRhaW5lcjtcclxuICAgICAgdGhpcy5fdG9nZ2xlckJ0biA9IG9wdGlvbnMudG9nZ2xlckJ0bjtcclxuICAgICAgdGhpcy5fakVsZW1lbnRUb2dnbGVyT3B0aW9ucyA9IG9wdGlvbnM7XHJcblxyXG4gICAgICB0aGlzLmluaXQoKTtcclxuICAgIH1cclxuXHJcbiAgICBpbml0KCkge1xyXG4gICAgICB0aGlzLl9qRWxlbWVudFRvZ2dsZXJPcHRpb25zLnRvZ2dsZXJCdG4gPSBudWxsO1xyXG4gICAgICB0aGlzLl9jbGlja0hhbmRsZXIgPSB0aGlzLmNsaWNrSGFuZGxlci5iaW5kKHRoaXMpO1xyXG4gICAgICB0aGlzLl8kZGVsZWdhdGVkQ29udGFpbmVyLm9uKCdjbGljaycsIHRoaXMuX2NsaWNrSGFuZGxlcik7XHJcbiAgICB9XHJcblxyXG4gICAgY2xpY2tIYW5kbGVyKGUpIHtcclxuICAgICAgbGV0IHRhcmdldCA9IGUudGFyZ2V0O1xyXG4gICAgICBsZXQgdG9nZ2xlckJ0biA9IHRhcmdldC5jbG9zZXN0KHRoaXMuX3RvZ2dsZXJCdG4pO1xyXG5cclxuICAgICAgaWYgKCF0b2dnbGVyQnRuIHx8XHJcbiAgICAgICAgKHRvZ2dsZXJCdG4uakVsZW1lbnRUb2dnbGVyICYmIHRvZ2dsZXJCdG4uakVsZW1lbnRUb2dnbGVyIGluc3RhbmNlb2YgSkVsZW1lbnRUb2dnbGVyQ29udHJvbGxlcilcclxuICAgICAgKSByZXR1cm47XHJcblxyXG4gICAgICAkKHRvZ2dsZXJCdG4pLmpFbGVtZW50VG9nZ2xlcih0aGlzLl9qRWxlbWVudFRvZ2dsZXJPcHRpb25zKTtcclxuICAgIH1cclxuICB9XHJcblxyXG5cclxuXHJcbiAgJC5mbi5qRWxlbWVudFRvZ2dsZXIgPSBmdW5jdGlvbiAoKSB7XHJcbiAgICBsZXQgXyA9IHRoaXM7XHJcbiAgICBsZXQgb3B0aW9ucyA9IGFyZ3VtZW50c1swXSB8fCB7fTtcclxuICAgIGxldCBhcmdzID0gQXJyYXkucHJvdG90eXBlLnNsaWNlLmNhbGwoYXJndW1lbnRzLCAxKTtcclxuXHJcbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IF8ubGVuZ3RoOyBpKyspIHtcclxuICAgICAgaWYgKHR5cGVvZiBvcHRpb25zID09PSAnb2JqZWN0Jykge1xyXG4gICAgICAgIGlmIChvcHRpb25zLmRlbGVnYXRlZCkge1xyXG4gICAgICAgICAgaWYgKCEkLmlzQXJyYXkoX1tpXS5kZWxlZ2F0ZWRUb2dnbGVyKSkge1xyXG4gICAgICAgICAgICBfW2ldLmRlbGVnYXRlZFRvZ2dsZXIgPSBbXTtcclxuICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICBvcHRpb25zLiRkZWxlZ2F0ZWRDb250YWluZXIgPSAkKF9baV0pO1xyXG4gICAgICAgICAgX1tpXS5kZWxlZ2F0ZWRUb2dnbGVyLnB1c2gobmV3IERlbGVnYXRlZFRvZ2dsZXJDb250cm9sbGVyKG9wdGlvbnMpKTtcclxuICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgb3B0aW9ucy50b2dnbGVyQnRuID0gX1tpXTtcclxuICAgICAgICAgIF9baV0uakVsZW1lbnRUb2dnbGVyID0gbmV3IEpFbGVtZW50VG9nZ2xlckNvbnRyb2xsZXIob3B0aW9ucyk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICAvL29wdGlvbnMudG9nZ2xlckJ0biA9IF9baV07XHJcbiAgICAgICAgLy9fW2ldLmpFbGVtZW50VG9nZ2xlciA9IG5ldyBKRWxlbWVudFRvZ2dsZXJDb250cm9sbGVyKG9wdGlvbnMpO1xyXG4gICAgICB9IGVsc2Uge1xyXG4gICAgICAgIGxldCByZXN1bHQgPSBfW2ldLmpFbGVtZW50VG9nZ2xlcltvcHRpb25zXS5jYWxsKF9baV0uakVsZW1lbnRUb2dnbGVyLCBhcmdzKTtcclxuXHJcbiAgICAgICAgaWYgKHR5cGVvZiByZXN1bHQgIT09ICd1bmRlZmluZWQnKSByZXR1cm4gcmVzdWx0O1xyXG4gICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgcmV0dXJuIF87XHJcbiAgfTtcclxufSk7XHJcbiJdfQ==
