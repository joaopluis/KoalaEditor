/*
 * The MIT License (MIT)
 *
 * Copyright (c) 2016 João Luís
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 */

var Koala = Koala || {};

(function ($) {

    $.event.props.push('dataTransfer');

    $.fn.blockParent = function () {
        return this.parents().filter(function () {
            return $(this).css("display") === "block";
        }).first();
    };

    Koala.languages = [];

    Koala.upload = function (file, uploadURL, onload, loadend, progress) {
        var xhr = new XMLHttpRequest();
        xhr.open("post", uploadURL, true);
        if (typeof progress === "function") {
            xhr.upload.addEventListener("progress", progress, false);
        }
        if (typeof onload === "function") {
            xhr.onload = onload;
        }
        if (typeof loadend === "function") {
            xhr.addEventListener("loadend", loadend, false);
        }
        var fdata = new FormData();
        fdata.append("file", file);
        xhr.send(fdata);
    };

    /**
     * Command class
     */

    Koala.Command = function (name, execute, isActive) {
        this.name = name;
        this.execute = execute;
        if (isActive) {
            this.isActive = isActive;
        } else {
            this.isActive = function () {
                return false;
            }
        }
    };

    Koala.commands = {};

    Koala.addCommand = function (name, execute, isActive) {
        Koala.commands[name] = new Koala.Command(name, execute, isActive);
    };

    Koala.getCommand = function (name) {
        if (Koala.commands[name]) {
            return Koala.commands[name];
        }
        return null;
    };

    /**
     * Koala Commands
     */

    Koala.addCommand("bold", function (editor, value) {
        document.execCommand("bold", false, value);
        editor.setHTML(editor.getHTML().replace('<b>', '<strong>').replace('</b>', '</strong>'));
    }, function (editor, value) {
        return document.queryCommandState("bold");
    });

    Koala.addCommand("italic", function (editor, value) {
        document.execCommand("italic", false, value);
        editor.setHTML(editor.getHTML().replace('<i>', '<em>').replace('</i>', '</em>'));
    }, function (editor, value) {
        return document.queryCommandState("italic");
    });

    Koala.addCommand("underline", function (editor, value) {
        document.execCommand("underline", false, value);
    }, function (editor, value) {
        return document.queryCommandState("underline");
    });

    Koala.addCommand("orderedList", function (editor, value) {
        document.execCommand("insertOrderedList", false, value);
    }, function (editor, value) {
        return document.queryCommandState("insertOrderedList");
    });

    Koala.addCommand("unorderedList", function (editor, value) {
        document.execCommand("insertUnorderedList", false, value);
    }, function (editor, value) {
        return document.queryCommandState("insertUnorderedList");
    });

    Koala.addCommand("formatBlock", function (editor, value) {
        var blockElement = $(editor.getSelection().focusNode).blockParent();
        if (blockElement.is(value)) {
            document.execCommand("formatBlock", false, "<p>");
        } else {
            document.execCommand("formatBlock", false, "<" + value + ">");
        }
    }, function (editor, value) {
        var blockElement = $(editor.getSelection().focusNode).blockParent();
        return blockElement.is(value);
    });

    Koala.addCommand("align", function (editor, value) {
        if ($.inArray(value, ["justifyLeft", "justifyCenter", "justifyRight", "justifyFull"]) > -1) {
            document.execCommand(value, false, null);
        }
    }, function (editor, value) {
        if ($.inArray(value, ["justifyLeft", "justifyCenter", "justifyRight", "justifyFull"])) {
            return document.queryCommandState(value);
        }
        return false;
    });

    Koala.addCommand("undo", function (editor, value) {
        document.execCommand("undo", false, value);
    }, function (editor, value) {
        return document.queryCommandState("undo");
    });

    Koala.addCommand("redo", function (editor, value) {
        document.execCommand("redo", false, value);
    }, function (editor, value) {
        return document.queryCommandState("redo");
    });

    Koala.addCommand("image", function (editor, value) {
        document.execCommand("insertImage", false, value);
    }, null);

    Koala.addCommand("link", function (editor, value) {
        document.execCommand("createLink", false, value);
    }, null);

    Koala.addCommand("unlink", function (editor, value) {
        document.execCommand("unlink", false, value);
    }, null);

    Koala.addCommand("code", function (editor, value) {
        if (editor.textWindow.is(":visible")) {
            editor.codeWindow.text(editor.html.trim());
            editor.codeWindow.show();
            editor.textWindow.hide();
        } else {
            //editor.textWindow.html(editor.html);
            editor.textWindow.show();
            editor.codeWindow.hide();
        }

        editor.updateToolbar();
    }, function (editor, value) {
        return editor.codeWindow.is(":visible");
    });


    /**
     * Button class
     */

    Koala.Button = function (options) {
        this.options = options;
    };

    Koala.Button.prototype.do = function (editor, value) {
        if (!value) {
            value = this.options.value;
        }
        if (this.options.command) {
            Koala.getCommand(this.options.command).execute(editor, value);
        }
    };

    Koala.Button.prototype.render = function (editor) {
        var btn = this;
        var btnDiv = $('<div />');
        btnDiv.addClass('ke-button-container')
        var button = $('<button />');
        button.addClass('ke-toolbar-button');
        button.attr('type', 'button');
        button.attr('data-name', this.options.name);
        button.attr('title', editor.getTranslation(this.options.label));
        if (this.options.icon) {
            button.html('<span class="fa ' + this.options.icon + '"></span>');
        } else if (this.options.label) {
            button.text(editor.getTranslation(this.options.label));
        } else if (this.options.name) {
            button.text(editor.getTranslation(this.options.name));
        }
        btnDiv.append(button);
        if (this.options.options) {
            button.append(' <span class="fa fa-caret-down"></span>');
            var dropdown = $('<div />');
            dropdown.addClass('ke-dropdown');
            var ddList = $('<ul />');
            $.each(this.options.options, function (index, value) {
                var template = '<li data-button="' + btn.options.name + '" data-value="' + value.value + '" title="' +
                               editor.getTranslation(value.label) + '">';
                if (value.icon) {
                    template += '<span class="fa ' + value.icon + '"></span>';
                } else {
                    template += editor.getTranslation(value.label);
                }
                template += '</li>';
                ddList.append(template);
            });
            dropdown.append(ddList);
            btnDiv.append(dropdown);
        }
        if (this.options.prompt) {
            var promptDiv = $('<div/>');
            promptDiv.addClass("ke-prompt");

            promptDiv.append("<div class=\"ke-arrow\"></div>");

            promptDiv.append("<header class=\"ke-prompt-header\"><h1>" + editor.getTranslation(this.options.label) +
                             "</h1></header>");

            var promptBody = $('<div/>');
            promptBody.addClass("ke-prompt-body");

            if (this.options.filePrompt && editor.settings.uploadURL) {

                var dropArea = $('<div />');
                dropArea.addClass("ke-drop-area");
                dropArea.append($("<p />").text(editor.getTranslation("Drop file")));
                dropArea.append($("<span />").text("(" + editor.getTranslation("or click") + ")"));
                var fileInput = $('<input type="file" />');
                if (this.options.accepts) {
                    fileInput.attr("accept", this.options.accepts);
                }
                promptBody.append(dropArea);
                var progressEl = $('<div />').addClass("ke-upload-progress").hide();
                promptDiv.append(progressEl);

                function doUpload(file) {
                    promptBody.slideUp();
                    promptFooter.slideUp();
                    progressEl.slideDown();
                    Koala.upload(file, editor.settings.uploadURL, function () {
                        result = JSON.parse(this.responseText);
                        Koala.getCommand(btn.options.command).execute(editor, result.link);
                    }, function () {
                        promptDiv.slideUp(function () {
                            promptBody.show();
                            promptFooter.show();
                            progressEl.hide();
                        });
                    }, function (event) {
                        if (event.lengthComputable) {
                            progressEl.css("width", (event.loaded / event.total) * 100 + "%");
                            progressEl.text(((event.loaded / event.total) * 100).toFixed(2) + "%");
                            progressEl.attr("aria-valuenow", ((event.loaded / event.total) * 100).toFixed(2));
                        }
                        else {
                            alert("Failed to compute file upload length");
                        }
                    });
                }

                dropArea.on("dragover", function (event) {
                    event.preventDefault();
                    event.stopPropagation();
                    $(this).addClass('dragging');
                });
                dropArea.on("dragleave", function (event) {
                    event.preventDefault();
                    event.stopPropagation();
                    $(this).removeClass('dragging');
                });

                dropArea.on("drop", function (event) {
                    event.stopPropagation();
                    event.preventDefault();
                    $(this).removeClass('dragging');
                    doUpload(event.dataTransfer.files[0]);
                });

                dropArea.on("click", function (event) {
                    event.preventDefault();
                    event.stopPropagation();
                    fileInput.trigger("click");
                });
                fileInput.on("change", function (event) {
                    file = $(this)[0].files[0];
                    doUpload(file);
                });
            }

            var promptP = $('<p/>');
            promptP.append($("<label/>").text(editor.getTranslation(this.options.prompt)));
            var promptInput = $('<input />');
            promptInput.addClass("ke-prompt-input");
            promptInput.attr("type", "text");
            promptP.append(promptInput);
            promptBody.append(promptP)
            promptDiv.append(promptBody);

            var promptFooter = $('<footer />');
            promptFooter.addClass("ke-prompt-footer");
            var promptBtn = $('<button />');
            promptBtn.attr('type', 'button');
            promptBtn.text(editor.getTranslation("OK"));
            promptFooter.append(promptBtn);
            promptDiv.append(promptFooter);
            btnDiv.append(promptDiv);

            promptBtn.on('click', function () {
                editor.range = editor.tmpRange;
                editor.resetSelection();
                Koala.getCommand(btn.options.command).execute(editor, promptInput.val());
                promptDiv.slideUp(function () {
                    promptInput.val("");
                });
            });
        }
        return btnDiv;
    };

    Koala.Button.prototype.isActive = function (editor, value) {
        if (this.options.command) {
            return Koala.getCommand(this.options.command).isActive(editor, value);
        }
        return false;
    };

    Koala.buttons = [];

    Koala.addButton = function (options) {
        Koala.buttons[options.name] = new Koala.Button(options);
    };

    Koala.getButton = function (name) {
        if (Koala.buttons[name]) {
            return Koala.buttons[name];
        }
        return null;
    };

    /**
     * Buttons
     */

    Koala.addButton({name: "bold", label: "Bold", icon: "fa-bold", command: "bold"});
    Koala.addButton({name: "italic", label: "Italic", icon: "fa-italic", command: "italic"});
    Koala.addButton({
        name: "underline",
        label: "Underline",
        icon: "fa-underline",
        command: "underline"
    });

    Koala.addButton({
        name: "ol",
        label: "Ordered list",
        icon: "fa-list-ol",
        command: "orderedList"
    });

    Koala.addButton({
        name: "ul",
        label: "Unordered list",
        icon: "fa-list-ul",
        command: "unorderedList"
    });

    Koala.addButton({
        name: "formatBlock",
        label: "Block Style",
        icon: "fa-paragraph",
        command: "formatBlock",
        options: [
            {
                value: "p",
                label: "Normal"
            },
            {
                value: "h1",
                label: "Heading 1"
            },
            {
                value: "h2",
                label: "Heading 2"
            },
            {
                value: "h3",
                label: "Heading 3"
            },
            {
                value: "h4",
                label: "Heading 4"
            }
        ]
    });

    Koala.addButton({
        name: "align",
        label: "Align",
        icon: "fa-align-left",
        command: "align",
        options: [
            {
                value: "justifyLeft",
                label: "Left",
                icon: "fa-align-left"
            },
            {
                value: "justifyCenter",
                label: "Center",
                icon: "fa-align-center"
            },
            {
                value: "justifyRight",
                label: "Right",
                icon: "fa-align-right"
            },
            {
                value: "justifyFull",
                label: "Justify",
                icon: "fa-align-justify"
            }
        ]
    });

    Koala.addButton({name: "undo", label: "Undo", icon: "fa-undo", command: "undo"});
    Koala.addButton({name: "redo", label: "Redo", icon: "fa-repeat", command: "redo"});

    Koala.addButton({
        name: "image",
        label: "Insert image",
        icon: "fa-image",
        command: "image",
        prompt: "Image URL:",
        filePrompt: true,
        accepts: "image/*"
    });
    Koala.addButton({
        name: "link", label: "Insert link", icon: "fa-link", command: "link", prompt: "Link URL:"
    });
    Koala.addButton({
        name: "unlink",
        label: "Remove link",
        icon: "fa-unlink",
        command: "unlink"
    });

    Koala.addButton({name: "code", label: "View code", icon: "fa-code", command: "code"});

    Koala.Editor = function (element, settings) {
        this.element = element;
        //this.editorBox = element;
        this.html = element.html();
        this.settings = settings;
        this.toolbar = null;
        this.textWindow = null;
        this.codeWindow = null;
        this.formControl = null;
    };

    Koala.Editor.prototype.init = function () {

        var editor = this;

        /***
         * If called on Form Control, create new div and keep formControl in sync.
         */

        if (this.element.is('input, textarea')) {
            this.formControl = this.element;
            this.html = this.formControl.val();
            var newDiv = $('<div />');
            this.formControl.after(newDiv);
            this.formControl.hide();
            this.editorBox = newDiv;
        } else {
            this.editorBox = this.element;
        }

        /***
         * Add Koala class to editor box and empty it. (its HTML was saved before)
         */

        this.editorBox.addClass('ke-box');
        this.editorBox.html("");

        /***
         * If a theme is passed as an option, add its class to the editor box.
         */

        if (this.settings.theme) {
            this.editorBox.addClass(this.settings.theme);
        }

        /***
         * Add toolbar unless it is set as false.
         */

        if (this.settings.toolbar) {

            /**
             * Create toolbar element.
             */
            this.toolbar = $('<div />', {
                "class": "ke-toolbar"
            });

            /**
             * Add the passed buttons to the toolbar.
             */
            $.each(this.settings.buttons, function (index, value) {
                if (value == "sep") {
                    editor.toolbar.append($('<div />').addClass("sep"));
                } else if (Koala.buttons[value]) {
                    var button = Koala.getButton(value).render(editor);
                    button.data("button", Koala.getButton(value));
                    editor.toolbar.append(button);
                }
            });

            /**
             * Add the toolbar to the main element.
             */
            this.editorBox.append(this.toolbar);

            /**
             * Act on button clicks.
             */
            this.toolbar.on('click', '.ke-toolbar-button', function (evt) {
                evt.preventDefault();
                evt.stopPropagation();
                editor.resetSelection();
                $('.ke-prompt, .ke-dropdown').not($(this).parent().find('.ke-prompt, .ke-dropdown')).slideUp();
                if (Koala.getButton($(this).attr('data-name')).options.options) {
                    $(this).parent().children(".ke-dropdown").slideToggle();
                } else if (Koala.getButton($(this).attr('data-name')).options.prompt) {
                    editor.tmpRange = editor.range;
                    $(this).parent().children(".ke-prompt").slideToggle();
                } else {
                    Koala.getButton($(this).attr('data-name')).do(editor, null);
                }
            });

            /**
             * Act on dropdown item click.
             */
            this.toolbar.on('click', '.ke-dropdown li', function (evt) {
                evt.preventDefault();
                evt.stopPropagation();
                editor.resetSelection();
                Koala.getButton($(this).attr("data-button")).do(editor, $(this).attr("data-value"));
                $(this).parents('.ke-dropdown').slideUp();

            });
        }

        /***
         * Create text window. (the element that will contain the visible content)
         */

        this.textWindow = $('<div />', {
            "class": "ke-editor",
            "contenteditable": ""
        });

        /***
         * Set text window HTML as the initial top element value and add it to the top element.
         */
        this.textWindow.html(this.getHTML());
        this.editorBox.append(this.textWindow);

        /***
         * Trigger contentchange.
         */
        this.textWindow.on('input', function (evt) {
            editor.element.trigger('koala.contentchange');
        });

        /***
         * Act on contentchange.
         */
        this.element.on('koala.contentchange', function (e) {
            editor.html = editor.textWindow.html();
            if (editor.formControl) {
                editor.formControl.val(editor.getHTML());
            }
            if (editor.html == "") {
                editor.textWindow.html("<p><br /></p>");
                editor.setCursor(0, 1);
            }
        });

        /***
         * Mark content as dirty. (initial html)
         */
        this.element.trigger('koala.contentchange');


        // Let's try some new Image Stuff!
        this.textWindow.on('click', 'img', function (e) {
            e.stopPropagation();
            var img = $(this);
            $(this).addClass('selected');
            $(this).wrap('<div class="editing-image"></div>');
            var wrapper = $(this).parent();
            var handler = $('<div />');
            handler.addClass('ke-img-handler ui-resizable-handle ui-resizable-se');
            handler.attr("id", "seGrip");
            wrapper.append(handler);
            $(this).resizable({
                aspectRatio: true,
                handles: 'se'
            });
        });

        this.textWindow.on('keyup', function (evt) {
            if (evt.which == 8) {
                if ($('.editing-image')) {
                    event.preventDefault();
                    $('.editing-image').remove();
                }
            }
        });

        this.textWindow.on('mousedown', function (evt) {

            var container = $('.editing-image');
            if (!container.is(evt.target) // if the target of the click isn't the container...
                && container.has(evt.target).length === 0) // ... nor a descendant of the container
            {
                var img = $('img.selected');
                img.resizable("destroy");
                $('.ke-img-handler').remove();
                img.unwrap();
                var w = img.css("width");
                var h = img.css("height");
                img.attr("style", "");
                img.css("width", w);
                img.css("height", h);
                img.removeClass('selected');
                editor.element.trigger("koala.contentchange");
            }

        });

        /***
         * Act on clicks outside
         * - Slide up dropdowns
         */
        $(document).mouseup(function (e) {
            var container = $(".ke-dropdown, .ke-prompt, .ke-toolbar-button");

            if (!container.is(e.target) // if the target of the click isn't the container...
                && container.has(e.target).length === 0) // ... nor a descendant of the container
            {
                $('.ke-dropdown, .ke-prompt').slideUp();
            }
        });

        /***
         * Trigger selection changed
         */
        this.textWindow.on('selectstart', function () {
            $(document).one('mouseup keyup', function () {
                editor.element.trigger('koala.selectchange');
            });
        });

        /***
         * Act on selectchange
         */
        this.element.on("koala.selectchange", function (evt) {
            editor.range = editor.getSelection().getRangeAt(0);
            editor.updateToolbar();
        });

        /***
         * Create code view window and append it to top element.
         */
        this.codeWindow = $('<pre />', {
            "class": "ke-code",
            "contenteditable": ""
        });
        this.codeWindow.on('input', function (evt) {
            editor.textWindow.html(editor.codeWindow.text().trim())
            editor.element.trigger('koala.contentchange');
        });
        this.editorBox.append(this.codeWindow);



        /***
         * Some tweaks for a better code.
         */
        document.execCommand('defaultParagraphSeparator', false, 'p');

    };

    Koala.Editor.prototype.getHTML = function () {
        return this.html;
    };

    Koala.Editor.prototype.setHTML = function (html) {
        this.textWindow.html(html);
        this.codeWindow.text(html);
        this.html = html;
    };

    Koala.Editor.prototype.insert = function (html) {
        this.resetSelection();
        document.execCommand("inserthtml", false, html);
    };

    Koala.Editor.prototype.destroy = function () {
        if (this.formControl) {
            this.editorBox.remove();
            this.formControl.show();
            this.formControl.data("koala", null);
        } else {
            this.editorBox.removeClass("ke-box");
            this.editorBox.html(this.getHTML());
            this.editorBox.data("koala", null);
        }
    };

    Koala.Editor.prototype.setCursor = function (row, column) {
        var range = document.createRange();
        var sel = window.getSelection();
        range.setStart(this.textWindow[0].childNodes[row], column);
        range.collapse(true);
        sel.removeAllRanges();
        sel.addRange(range);
    };

    function createCaretPlacer(atStart, el) {
        el = $(el).get(0);
        el.focus();
        if (typeof window.getSelection != "undefined"
            && typeof document.createRange != "undefined") {
            var range = document.createRange();
            range.selectNodeContents(el);
            range.collapse(atStart);
            var sel = window.getSelection();
            sel.removeAllRanges();
            sel.addRange(range);
        } else if (typeof document.body.createTextRange != "undefined") {
            var textRange = document.body.createTextRange();
            textRange.moveToElementText(el);
            textRange.collapse(atStart);
            textRange.select();
        }
    }

    Koala.Editor.prototype.setCursorToStart = function () {
        createCaretPlacer(true, this.editorBox);
    };

    Koala.Editor.prototype.setCursorToEnd = function () {
        createCaretPlacer(false, this.editorBox);
    };

    Koala.Editor.prototype.getSelection = function () {
        return window.getSelection();
    };

    Koala.Editor.prototype.resetSelection = function () {
        if (this.range) {
            var sel = window.getSelection();
            sel.removeAllRanges();
            sel.addRange(this.range);
        } else {
            this.setCursorToEnd();
        }
    };

    Koala.Editor.prototype.executeCommand = function (name, value) {
        Koala.getCommand(name).execute(this, value);
    };

    Koala.Editor.prototype.updateToolbar = function () {
        if (this.settings.toolbar) {
            var editor = this;
            this.toolbar.find('.ke-toolbar-button').each(function (index) {
                if (Koala.getButton($(this).attr('data-name')).isActive(editor,
                        Koala.getButton($(this).attr('data-name')).options.value)) {
                    $(this).addClass("active");
                } else {
                    $(this).removeClass("active");
                }
            });
        }
    };

    Koala.Editor.prototype.getTranslation = function (string) {
        if (this.settings.language && Koala.languages[this.settings.language] &&
            Koala.languages[this.settings.language][string]) {
            return Koala.languages[this.settings.language][string];
        }
        return string;
    };

    Koala.Editor.prototype.attr = function (name) {
        return this.element.attr(name);
    };

    $.fn.koala = function (options) {

        if (this.data('koala')) {
            return this.data('koala');
        }

        var settings = $.extend({
            buttons: ['bold', 'italic', 'underline', 'sep', 'align', 'formatBlock', 'ul', 'ol', 'image', 'link',
                      'unlink', 'sep', 'undo', 'redo', 'sep', 'code'],
            toolbar: true
        }, options);

        var editor = new Koala.Editor(this, settings);

        this.data('koala', editor);

        editor.init();

        return editor;
    };

}(jQuery));