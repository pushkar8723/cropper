/*
 * Cropper v0.1.0
 * https://github.com/fengyuanchen/cropper
 *
 * Copyright 2014 Fenngyuan Chen
 * Released under the MIT license
 */

(function(fn, undefined) {
    if (typeof define === "function" && define.amd) {
        define(["jquery"], fn);
    } else {
        fn(jQuery);
    }
}(function($) {

    "use strict";

    var $document = $(document),
        Cropper = function(element, options) {
            options = $.isPlainObject(options) ? options : {};
            this.$element = $(element);
            this.defaults = $.extend({}, Cropper.defaults, this.$element.data(), options);
            this.init();
        };

    Cropper.prototype = {
        construstor: Cropper,
        
        init: function() {
            var ratio = this.defaults.aspectRatio;
            
            this.defaults.aspectRatio = typeof ratio === "number" && ratio > 0 ? ratio : 1;
            this.enable();
        },

        enable: function(url) {
            var $element = this.$element;

            if (this.active) {
                return;
            }

            url = url || $element.prop("src");

            if (!url) {
                throw new Error("Invalid image!");
            }

            this.url = url;
            this.$cropper = $(Cropper.template);
            this.$dragger = this.$cropper.find(".cropper-dragger");
           
            Cropper.fn.toggle($element);
            $element.after(this.$cropper);
            
            if (!this.defaults.modal) {
                Cropper.fn.toggle(this.$cropper.find(".cropper-modal"));
            }

            this.setPreview();
            this.setImage();
            this.addListener();
            this.active = true;
        },

        disable: function() {

            if (!this.active) {
                return;
            }

            this.removeListener();
            this.$cropper.empty().remove();
            Cropper.fn.toggle(this.$element);

            this.$cropper = null;
            this.$dragger = null;
            this.$preview = null;

            this.cropper = null;
            this.dragger = null;
            this.image = null;
            this.url = "";
            this.active = false;
        },

        addListener: function() {
            this.$element.on("load", $.proxy(this.load, this));
            this.$dragger.on("mousedown", $.proxy(this.mousedown, this));
            $document.on("mousemove", $.proxy(this.mousemove, this));
            $document.on("mouseup", $.proxy(this.mouseup, this));
        },

        removeListener: function() {
            this.$element.off("load", this.load);
            this.$dragger.off("mousedown", this.mousedown);
            $document.off("mousemove", this.mousemove);
            $document.off("mouseup", this.mouseup);
        },

        load: function() {
            var url;
            
            if (this.active) {
                url = this.$element.prop("src");

                if (url && url !== this.url) {
                    this.destory();
                    this.enable(url);
                }

                return;
            }

            this.enable();
        },
        
        mousedown: function(e) {
            var resize = $(e.target).data().resize;

            if (typeof resize === "string" && resize.length > 0) {
                this.mouseX1 = e.clientX;
                this.mouseY1 = e.clientY;
                this.resize = resize;
            }
        },

        mousemove: function(e) {
            if (this.resize) {
                this.mouseX2 = e.clientX;
                this.mouseY2 = e.clientY;
                this.resizing();
            }
        },
        
        mouseup: function() {
            this.resize = "";
        },
        
        setImage: function() {
            var that = this,
                $image = $('<img src="' + this.url + '">');

            $image.on("load", function() {
                var $this = $(this),
                    image;

                if (this.naturalWidth && this.naturalHeight) {
                    image = {
                        naturalHeight: this.naturalHeight,
                        naturalWidth: this.naturalWidth
                    };
                } else {
                    Cropper.fn.size($this, {
                        height: "auto",
                        width: "auto"
                    });

                    image = Cropper.fn.size($this);
                    image = {
                        naturalHeight: image.height,
                        naturalWidth: image.width
                    };
                }

                Cropper.fn.size($this, {
                    height: "100%",
                    width: "100%"
                });

                that.image = image;
                that.setCropper();
            });
            
            this.$cropper.prepend($image);
        },
        
        setPreview: function() {
            var preview = this.defaults.preview;
                
            this.$preview = this.$cropper.find(".cropper-preview");
            
            if (typeof preview === "string" && preview.length > 0) {
                this.$preview = this.$preview.add(preview);
            }
            
            this.$preview.html('<img src="' + this.url + '">');
        },
        
        setCropper: function() {
            var $container = this.$element.parent(),
                container = Cropper.fn.size($container),
                image = this.image,
                cropper;

            if (((image.naturalWidth * container.height / image.naturalHeight) - container.width) >= 0) {
                cropper = {
                    height: container.width * image.naturalHeight / image.naturalWidth,
                    width: container.width,
                    left: 0
                };

                cropper.top = (container.height - cropper.height) / 2;
            } else {
                cropper = {
                    height: container.height,
                    width: container.height * image.naturalWidth / image.naturalHeight,
                    top: 0
                };

                cropper.left = (container.width - cropper.width) / 2;
            }

            $.each(cropper, function(i, n) {
                cropper[i] = Math.round(n);
            });

            image.height = cropper.height;
            image.width = cropper.width;

            Cropper.fn.position($container);
            this.$cropper.css({
                height: cropper.height,
                left: cropper.left,
                top: cropper.top,
                width: cropper.width
            });

            this.cropper = cropper;
            this.setDragger();
        },
        
        setDragger: function() {
            var cropper = this.cropper,
                ratio = this.defaults.aspectRatio,
                dragger;

            if (((cropper.height * ratio) - cropper.width) >= 0) {
                dragger = {
                    height: cropper.width / ratio,
                    width: cropper.width,
                    left: 0,
                    top: (cropper.height - (cropper.width / ratio)) / 2,
                    maxWidth: cropper.width,
                    maxHeight: cropper.width / ratio
                };
            } else {
                dragger = {
                    height: cropper.height,
                    width: cropper.height * ratio,
                    left: (cropper.width - (cropper.height * ratio)) / 2,
                    top: 0,
                    maxHeight: cropper.height,
                    maxWidth: cropper.height * ratio
                };
            }

            dragger.height *= 0.8;
            dragger.width *= 0.8;
            dragger.left = (cropper.width - dragger.width) / 2;
            dragger.top = (cropper.height - dragger.height) / 2;

            this.dragger = Cropper.fn.round(dragger);
            this.resetDragger();
        },
            
        resetDragger: function() {
            var dragger = this.dragger,
                cropper = this.cropper;

            dragger.width = dragger.width > dragger.maxWidth ? dragger.maxWidth : Math.abs(dragger.width);
            dragger.height = dragger.height > dragger.maxHeight ? dragger.maxHeight : Math.abs(dragger.height);

            dragger.maxLeft = cropper.width - dragger.width;
            dragger.maxTop = cropper.height - dragger.height;

            dragger.left = dragger.left < 0 ? 0 : dragger.left > dragger.maxLeft ? dragger.maxLeft : dragger.left;
            dragger.top = dragger.top < 0 ? 0 : dragger.top > dragger.maxTop ? dragger.maxTop : dragger.top;

            dragger = Cropper.fn.round(dragger);

            this.$dragger.css({
                height: dragger.height,
                left: dragger.left,
                top: dragger.top,
                width: dragger.width
            });

            this.preview();
            this.output();
        },

        resizing: function() {
            var resize = this.resize,
                dragger = this.dragger,
                ratio = this.defaults.aspectRatio,
                range = {
                    x: this.mouseX2 - this.mouseX1,
                    y: this.mouseY2 - this.mouseY1
                };

            range.X = range.y * ratio;
            range.Y = range.x / ratio;

            switch (resize) {

                // resize
                case "e":
                    dragger.width += range.x;
                    dragger.height = dragger.width / ratio;
                    dragger.top -= range.Y / 2;
                    this.resize = dragger.width < 0 ? "w" : resize;
                    break;

                case "n":
                    dragger.height -= range.y;
                    dragger.width = dragger.height * ratio;
                    dragger.left += range.X / 2;
                    dragger.top += range.y;
                    this.resize = dragger.height < 0 ? "s" : resize;
                    break;

                case "w":
                    dragger.width -= range.x;
                    dragger.height = dragger.width / ratio;
                    dragger.left += range.x;
                    dragger.top += range.Y / 2;
                    this.resize = dragger.width < 0 ? "e" : resize;
                    break;

                case "s":
                    dragger.height += range.y;
                    dragger.width = dragger.height * ratio;
                    dragger.left -= range.X / 2;
                    this.resize = dragger.height < 0 ? "n" : resize;
                    break;

                case "ne":
                    dragger.height -= range.y;
                    dragger.width = dragger.height * ratio;
                    dragger.top += range.y;
                    this.resize = dragger.height < 0 ? "sw" : resize;
                    break;

                case "nw":
                    dragger.height -= range.y;
                    dragger.width = dragger.height * ratio;
                    dragger.left += range.X;
                    dragger.top += range.y;
                    this.resize = dragger.height < 0 ? "se" : resize;
                    break;

                case "sw":
                    dragger.width -= range.x;
                    dragger.height = dragger.width / ratio;
                    dragger.left += range.x;
                    this.resize = dragger.width < 0 ? "ne" : resize;
                    break;

                case "se":
                    dragger.width += range.x;
                    dragger.height = dragger.width / ratio;
                    this.resize = dragger.width < 0 ? "nw" : resize;
                    break;

                // move
                default:
                    dragger.left += this.mouseX2 - this.mouseX1;
                    dragger.top += this.mouseY2 - this.mouseY1;
            }

            this.resetDragger();
            this.mouseX1 = this.mouseX2;
            this.mouseY1 = this.mouseY2;
        },

        output: function() {
            var ratio = this.image.width / this.image.naturalWidth,
                dragger = this.dragger,
                data = {
                    x1: dragger.left,
                    y1: dragger.top,
                    x2: dragger.left + dragger.width,
                    y2: dragger.top + dragger.height,
                    height: dragger.height,
                    width: dragger.width
                };

            data = Cropper.fn.round(data, function(n) {
                return n / ratio;
            });

            this.defaults.done(data);
        },
        
        preview: function() {
            var that = this;

            this.$preview.each(function() {
                var $this = $(this),
                    cropper = that.cropper,
                    dragger = that.dragger,
                    ratio = $this.width() / dragger.width,
                    styles = {
                        height: cropper.height,
                        marginLeft: - dragger.left,
                        marginTop: - dragger.top,
                        width: cropper.width
                    };
                
                styles = Cropper.fn.round(styles, function(n) {
                    return n * ratio;
                });
                
                $this.css({overflow: "hidden"});
                $this.find("img").css(styles);
            });
        }
    };

    // Common methods
    Cropper.fn = {
        toggle: function($e) {
            $e.toggleClass("cropper-hidden");
        },
        
        position: function($e, option) {
            var position = $e.css("position");

            if (position === "static") {
                $e.css("position", option || "relative");
            }
        },
        
        size: function($e, options) {
            if ($.isPlainObject(options)) {
                $e.css(options);
            } else {
                return {
                    height: $e.height(),
                    width: $e.width()
                };
            }
        },
        
        round: function(data, fn) {
            var value,
                i;

            for (i in data) {
                value = data[i];

                if (data.hasOwnProperty(i) && typeof value === "number") {
                    data[i] = Math.round($.isFunction(fn) ? fn(value) : value);
                }
            }

            return data;
        }
    };

    Cropper.template = [
        '<div class="cropper-container">',
            '<div class="cropper-modal"></div>',
            '<div class="cropper-dragger">',
                '<span class="cropper-preview"></span>',
                '<span class="cropper-dashed dashed-h"></span>',
                '<span class="cropper-dashed dashed-v"></span>',
                '<span class="cropper-face" data-resize="*"></span>',
                '<span class="cropper-line line-e" data-resize="e"></span>',
                '<span class="cropper-line line-n" data-resize="n"></span>',
                '<span class="cropper-line line-w" data-resize="w"></span>',
                '<span class="cropper-line line-s" data-resize="s"></span>',
                '<span class="cropper-point point-e" data-resize="e"></span>',
                '<span class="cropper-point point-n" data-resize="n"></span>',
                '<span class="cropper-point point-w" data-resize="w"></span>',
                '<span class="cropper-point point-s" data-resize="s"></span>',
                '<span class="cropper-point point-ne" data-resize="ne"></span>',
                '<span class="cropper-point point-nw" data-resize="nw"></span>',
                '<span class="cropper-point point-sw" data-resize="sw"></span>',
                '<span class="cropper-point point-se" data-resize="se"></span>',
            '</div>',
        '</div>'
    ].join("");

    Cropper.defaults = {
        aspectRatio: 1,
        done: function(/* data */) { /* handle data */ },
        modal: true,
        preview: ""
    };

    Cropper.setDefaults = function(options) {
        var i;

        for (i in options) {
            if (options.hasOwnProperty(i) && typeof Cropper.defaults[i] !== "undefined") {
                Cropper.defaults[i] = options[i];
            }
        }
    };

    // Define as a jquery method
    $.fn.cropper = function(options) {
        return this.each(function() {
            $(this).data("cropper", new Cropper(this, options));
        });
    };

    $.fn.cropper.Constructor = Cropper;
    $.fn.cropper.setDefaults = Cropper.setDefaults;

    $(function() {
        $("[cropper]").cropper();
    });
}));