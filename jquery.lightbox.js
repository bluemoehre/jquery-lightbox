/**
 * @license GNU General Public License v2 http://www.gnu.org/licenses/gpl-2.0
 * @author BlueMöhre <bluemoehre@gmx.de>
 * @copyright 2014 BlueMöhre
 * @link http://www.github.com/bluemoehre
 */
(function ($, win, doc) {

    'use strict';

    // --- Plugin scope (shared between all plugin instances) ---

    /**
     * The plugin name and data-attribute name/selector
     * WARNING: THIS WILL OVERWRITE NATIVE AND PREVIOUSLY REGISTERED JQUERY FUNCTIONS - CHOOSE WITH CARE!
     * @type {!string}
     */
    var PLUGIN_NAME = 'lightbox';

    /**
     * Key codes
     * @type {!Object.<string, number>}
     */
    var KEY = {
        ESC: 27
    };

    /**
     * The plugin defaults
     * @type {Object}
     */
    var defOpts = {
        tplLightbox: '<div id="lightbox" style="z-index:1000"><button name="close"></button><div class="narrow"></div></div>',
        tplDarkness: '<div id="darkness" style="position:fixed; top:0; left:0; right:0; bottom:0; background-color:rgba(0,0,0,0.5); z-index:999"></div>',
        selectClose: 'button[name=close]',
        selectContent: '.narrow',
        content: null,
        waitForImages: true,
        textError: 'Error: The requested content is not available at the moment.',
        animationSpeed: 'fast'
    };

    /**
     * @type {!jQuery}
     */
    var $win = $(win);

    /**
     * @type {!jQuery}
     */
    var $doc = $(doc);

    /**
     * The current visible darkness layer
     * @type {?jQuery}
     */
    var $currentDarkness = null;

    /**
     * The current visible lightbox
     * @type {?jQuery}
     */
    var $currentLightbox = null;

    /**
     * Contains a running request
     * @type {?jqXHR}
     */
    var runningRequest = null;

    /**
     * TODO remove
     */
    var debug = console;
    debug.level = Debug.DEBUG_LOG; // TODO remove me after everything works =)



    /**
     * Wait for all images within given content to load before calling the callback
     * @param {!jQuery} $content
     * @param {function} [callback]
     */
    function waitForImages($content, callback) {
        debug.log('waitForImages() called');
        callback = typeof callback === 'function' ? callback : $.noop;
        var $uncachedImages = $content.find('img').addBack('img').filter(function () {
            var img = new Image();
            img.src = this.src;
            return !img.complete;
        });
        var uncachedImagesCount = $uncachedImages.length;

        $uncachedImages.each(function () {
            var img = new Image();
            $(img).one('load.' + PLUGIN_NAME + ' error.' + PLUGIN_NAME, function (evt) {
                debug.log(evt.type + ' event triggered on', this);
                uncachedImagesCount--;
                if (uncachedImagesCount === 0) {
                    debug.log('all images have completed loading');
                    callback();
                }
            });
            img.src = this.src;
        });

        debug.log('waiting for ' + uncachedImagesCount + ' images to load');
    }

    /**
     * Loads content from remote resource
     */
    function loadRemoteContent(url, callback) {
        debug.log('loadRemoteContent() called with', url);
        abortRequest();
        debug.info('requesting "' + url + '"');
        runningRequest = $.ajax({
            url: url,
            dataType: 'html',
            success: function (data) {
                debug.info('request succeeded');
                callback(data);
            },
            error: function (jqXhr) {
                // if returned data was an image return the related HTML-Tag for the image
                if (jqXhr.getResponseHeader('content-type').match(/^image\//)) {
                    debug.info('server answered with an image - building tag for that');
                    callback('<img src="' + encodeURIComponent(url) + '" alt="" />');
                } else {
                    debug.warn('request failed');
                }
            },
            complete: function () {
                runningRequest = null;
            }
        });
    }

    /**
     * Abort a currently running request
     */
    function abortRequest() {
        debug.log('abortRequest() called');
        if (runningRequest !== null) {
            debug.log('aborting running request on "' + runningRequest + '"');
            runningRequest.abort();
            runningRequest = null;
        }
    }


    /**
     * Plugin constructor
     * @param {HTMLElement} el
     * @param {Array} args
     * @constructor
     */
    function Plugin(el, args) {

        // --- Instance scope (shared between all plugin functions on the given element) ---

        /**
         * The element which was passed to the plugin
         * @type {!jQuery}
         */
        var $el = $(el);

        /**
         * The plugin settings for this instance
         * @type {!Object}
         */
        var opts = {};

        /**
         * Self-reference
         * @type {!Plugin}
         */
        var self = this;

        /**
         * @type {!jQuery}
         */
        var $darkness;

        /**
         * @type {!jQuery}
         */
        var $lightbox;


        /**
         * Init function for setting up this instance
         * The settings are cascaded in the following order:
         *  - the plugin defaults
         *  - the given options via jQuery-call
         *  - the element options via attribute
         *  - the element options via data-attribute
         *  (latest takes precedence)
         *
         * @param {Object} initOpts
         */
        function init(initOpts) {

            var dataOptStr = $el.attr('data-' + PLUGIN_NAME);
            var dataOpts = dataOptStr ? $.parseJSON(dataOptStr) : {};
            var attrOpts = {};
            if ($el.is('a') && $el.prop('href')) {
                attrOpts.content = $el.prop('href');
            }
            opts = $.extend(opts, defOpts, initOpts, attrOpts, dataOpts);

            // init darkness
            if (!$darkness) {
                $darkness = $(opts.tplDarkness).fadeTo(0, 0);
            }

            // init lightbox itself (without content)
            if (!$lightbox) {
                $lightbox = $(opts.tplLightbox).hide().fadeTo(0, 0).css({
                    display: 'block',
                    position: 'fixed',
                    top: 0,
                    left: 0
                });
            }

            // --- bind events ---
            $el.on('click.' + PLUGIN_NAME, function (evt) {
                debug.log(evt.type + ' event triggered on', this);
                evt.preventDefault();
                self.show();
            });
            $win.on('keyup.' + PLUGIN_NAME, function (evt) {
                debug.log(evt.type + ' event triggered on', this);
                if (evt.keyCode === KEY.ESC) {
                    self.hide();
                }
            });
            $darkness.on('click.' + PLUGIN_NAME, function (evt) {
                debug.log(evt.type + ' event triggered on', this);
                evt.preventDefault();
                self.hide();
            });
            $lightbox.on('click.' + PLUGIN_NAME, opts.selectClose, function (evt) {
                debug.log(evt.type + ' event triggered on', this);
                evt.preventDefault();
                self.hide();
            });
        }

        /**
         * Inserts and show the darkness layer of this instance
         */
        function showDarkness() {
            debug.log('showDarkness() called');
            $darkness.prependTo('body').stop(true).show();

            // replace current darkness
            // do NOT use configured animationSpeed, due it may differ between instances
            if ($currentDarkness && $currentDarkness !== $darkness) {
                $currentDarkness.stop(true).fadeTo(200, 0, function () {
                    $(this).detach();
                });
                $darkness.fadeTo(200, 1);
            } else {
                $darkness.fadeTo(opts.animationSpeed, 1);
            }
            $currentDarkness = $darkness;
        }

        /**
         * Hides and removes the darkness layer of this instance
         */
        function hideDarkness() {
            debug.log('hideDarkness() called');
            $currentDarkness = null;
            $darkness.stop(true).fadeTo(opts.animationSpeed, 0, function () {
                $darkness.detach();
            });
        }

        /**
         * Shows and centers the Lightbox with its current contents
         */
        function showLightbox() {
            debug.log('showLightbox() called');
            $lightbox.prependTo('body').stop(true).show();
            centerLightbox();
            if ($currentLightbox && $currentLightbox !== $lightbox) {
                $currentLightbox.remove();
            } else {
                $lightbox.fadeTo(opts.animationSpeed, 1);
            }
            $currentLightbox = $lightbox;
            $win.on('resize.' + PLUGIN_NAME, function (evt) {
                debug.log(evt.type + ' event triggered on', this);
                centerLightbox();
            });
            $lightbox.on('DOMNodeInserted.' + PLUGIN_NAME + ' DOMNodeRemoved.' + PLUGIN_NAME, function () {
                centerLightbox();
            });
        }

        /**
         * Hides and detaches the lightbox
         */
        function hideLightbox() {
            debug.log('hideLightbox() called');
            $win.off('resize.' + PLUGIN_NAME);
            $lightbox
                .off('DOMNodeInserted.' + PLUGIN_NAME + ' DOMNodeRemoved.' + PLUGIN_NAME)
                .stop(true)
                .fadeTo(opts.animationSpeed, 0, function () {
                    $lightbox.detach();
                });
        }

        /**
         * Centers the lightbox in the viewport/window
         * If its higher than the viewport it uses absokute position to be scrollable
         */
        function centerLightbox() {
            debug.log('center() called');
            var top = ($win.height() - $lightbox.outerHeight()) / 2;
            var left = ($win.width() - $lightbox.outerWidth()) / 2;
            if (top >= 0) {
                $lightbox.css('position', 'fixed');
            } else {
                $lightbox.css('position', 'absolute');
                top = $win.scrollTop();
            }
            $lightbox.css('top', Math.round(top));
            $lightbox.css('left', Math.round(left));
        }

        /**
         * Replaces the current content of the lightbox with given one
         * @param {string|jQuery} content
         * @param {function} [callback]
         */
        function loadContent(content, callback) {
            debug.log('setContent() called with', content);
            callback = typeof callback === 'function' ? callback : $.noop;
            var $content = content instanceof jQuery ? content : $($.parseHTML($.trim(content)));
            if (opts.waitForImages) {
                waitForImages($content, function () {
                    removeContent();
                    $lightbox
                        .find(opts.selectContent)
                        .append($content)
                        .trigger('DOMContentAdded', $content); // Trigger special event to inform other plugins of new content
                    callback();
                });
            } else {
                removeContent();
                $lightbox
                    .find(opts.selectContent)
                    .append($content)
                    .trigger('DOMContentAdded', $content); // Trigger special event to inform other plugins of new content
                callback();
            }
        }

        /**
         * Removes the content off the lightbox
         */
        function removeContent() {
            debug.log('removeContent() called');
            $lightbox.find(opts.selectContent).empty();
        }

        /**
         * Show lightbox, retrieve its contents before if necessary
         */
        this.show = function () {
            if (opts.content.length > 0) {
                if (typeof opts.content === 'string' && opts.content.match(/^(https?:\/)?\//)) {
                    loadRemoteContent(opts.content, function (content) {
                        loadContent(content, function () {
                            showDarkness();
                            showLightbox();
                        });
                    });
                } else {
                    loadContent(opts.content, function () {
                        showDarkness();
                        showLightbox();
                    });
                }
            } else {
                debug.info('nothing to show');
            }
        };

        /**
         * Hide lightbox
         */
        this.hide = function () {
            hideLightbox();
            hideDarkness();
        };

        /**
         * Remove this plugin off the element
         * This function should revert all changes which have been made by this plugin
         */
        this.destroy = function () {
            $win.off('.' + PLUGIN_NAME);
            $lightbox.remove();
            $darkness.remove();
            $el.find('*').addBack().off('.' + PLUGIN_NAME);
            $el.removeData(PLUGIN_NAME);
            $el = null;
        };


        init(args);
    }


    // Register plugin on jQuery
    $.fn[PLUGIN_NAME] = function () {
        var args = arguments || [];
        var val;

        this.each(function () {

            // Prevent multiple instances for same element
            var instance = $.data(this, PLUGIN_NAME);
            if (!instance) {
                instance = new Plugin(this, typeof args[0] === 'object' ? args[0] : {});
                $.data(this, PLUGIN_NAME, instance);
            }

            // Call public function
            // If it returns something, break the loop and return the value
            if (typeof args[0] === 'string') {
                if (typeof instance[args[0]] === 'function') {
                    val = instance[args[0]](args[1]);
                } else {
                    $.error('Method "' + args[0] + '" does not exist for ' + PLUGIN_NAME + ' plugin');
                }
            }

            return val === undefined;
        });

        return val === undefined ? this : val;
    };

    // Register directly to jQuery to give the possibility of overwriting the default options
    $[PLUGIN_NAME] = function (opts) {
        if (typeof opts === 'object') {
            $.extend(defOpts, opts);
        } else {
            $.error('Expected configuration object');
        }
    };

    // Try using a global config object
    try {
        $.extend(defOpts, win.config[PLUGIN_NAME]);
    } catch (e) {}

    // Auto pilot
    $doc.on('ready ajaxStop DOMContentAdded', function (evt, nodes) {
        (nodes ? $(nodes) : $doc).find('[data-' + PLUGIN_NAME + ']').addBack('[data-' + PLUGIN_NAME + ']')[PLUGIN_NAME]();
    });


})(jQuery, window, document);