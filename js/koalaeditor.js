/**
 * Created by João on 03/02/2015.
 */

(function ($) {

    function nl2br(str, is_xhtml) {
        var breakTag = (is_xhtml || typeof is_xhtml === 'undefined') ? '<br />' : '<br>';
        return (str + '').replace(/([^>\r\n]?)(\r\n|\n\r|\r|\n)/g, '$1' + breakTag + '$2');
    }

    $.fn.blockParent = function () {
        return this.parents().filter(function () {
            return $(this).css("display") === "block";
        }).first();
    }

    var KOALA = KOALA || {};

    KOALA.Button = function (options) {
        this.options = options;
    };

    KOALA.Button.prototype.do = function (editor, button, value) {
        console.log("inDo");
        if(!value){
            value = this.options.value;
        }
        console.log(value);
        if (this.options.command) {
            if (KOALA.commands[this.options.command]) {
                console.log("custom command");
                KOALA.commands[this.options.command].execute(value);
            } else {
                console.log(this.options.command);
                document.execCommand(this.options.command, false, value);
            }
        }
        if (this.options.function) {
            this.options.function(editor, button, value);
        }
    };

    KOALA.Button.prototype.render = function () {
        var btn = this;
        var btnDiv = $('<div />');
        btnDiv.addClass('ke-button-container')
        var button = $('<button />');
        button.addClass('ke-toolbar-button');
        button.attr('data-name', this.options.name);
        if (this.options.icon) {
            button.html('<span class="fa ' + this.options.icon + '"></span>');
        } else if (this.options.label) {
            button.text(this.options.label);
        } else if (this.options.name) {
            button.text(this.options.name);
        }
        btnDiv.append(button);
        if (this.options.options) {
            button.append(' <span class="fa fa-caret-down"></span>');
            var dropdown = $('<div />');
            dropdown.addClass('ke-dropdown');
            var ddList = $('<ul />');
            console.log(this.options.options);
            $.each(this.options.options, function (index, label) {
                ddList.append('<li data-button="'+btn.options.name+'" data-value="' + index + '">' + label + '</li>');
            })
            dropdown.append(ddList);
            btnDiv.append(dropdown);
        }
        return btnDiv;
    };

    KOALA.Button.prototype.isActive = function (value) {
        if (this.options.command) {
            if (KOALA.commands[this.options.command]) {
                return KOALA.commands[this.options.command].isActive(value);
            }
            return document.queryCommandState(this.options.command);
        }
        return false;
    };

    KOALA.buttons = [];

    KOALA.buttons['bold'] = new KOALA.Button({
        name: "bold", icon: "fa-bold", command: "bold", function: function (editor, button) {
            editor.setHTML(editor.getHTML().replace('<b>', '<strong>').replace('</b>', '</strong>'));
        }
    });
    KOALA.buttons['italic'] = new KOALA.Button({name: "italic", icon: "fa-italic", command: "italic"});
    KOALA.buttons['underline'] = new KOALA.Button({
        name: "underline",
        icon: "fa-underline",
        command: "underline"
    });

    KOALA.buttons['ol'] = new KOALA.Button({name: "ol", icon: "fa-list-ol", command: "insertOrderedList"});
    KOALA.buttons['ul'] = new KOALA.Button({name: "ul", icon: "fa-list-ul", command: "insertUnorderedList"});

    KOALA.buttons['formatBlock'] = new KOALA.Button({
        name: "formatBlock",
        icon: "fa-paragraph",
        command: "formatBlock",
        options: {
            p: "Normal",
            h1: "Cabeçalho 1"
        }
    });

    KOALA.buttons['undo'] = new KOALA.Button({name: "undo", icon: "fa-undo", command: "undo"});
    KOALA.buttons['redo'] = new KOALA.Button({name: "redo", icon: "fa-repeat", command: "redo"});

    KOALA.buttons['image'] = new KOALA.Button({
        name: "image", icon: "fa-image", function: function (editor, button) {
            var url = prompt("URL da imagem:");
            document.execCommand("insertImage", false, url);
        }
    });
    KOALA.buttons['link'] = new KOALA.Button({
        name: "link", icon: "fa-link", function: function (editor, button) {
            var url = prompt("URL destino:");
            document.execCommand("createLink", false, url);
        }
    });
    KOALA.buttons['unlink'] = new KOALA.Button({name: "unlink", icon: "fa-unlink", command: "unlink"});

    KOALA.buttons['code'] = new KOALA.Button({
        name: "code", icon: "fa-code", function: function (editor, button) {
            if (editor.textWindow.is(":visible")) {
                button.addClass("active");
                editor.codeWindow.text(editor.html.trim());
                editor.codeWindow.show();
                editor.textWindow.hide();
            } else {
                button.removeClass("inactive");
                editor.textWindow.html(editor.html);
                editor.textWindow.show();
                editor.codeWindow.hide();
            }
            //alert(document.getSelection());
        }
    });

    KOALA.Command = function (name, execute, isActive) {
        this.name = name;
        this.execute = execute;
        if (isActive) {
            this.isActive = isActive;
        } else {
            this.isActive = function () {
                return false;
            }
        }
    }

    KOALA.commands = {};
    KOALA.commands['formatBlock'] = new KOALA.Command("formatBlock", function (value) {
        console.log("$"+value+"$");
        var selection = window.getSelection();
        var blockElement = $(window.getSelection().focusNode).blockParent();
        if (blockElement.is(value)) {
            console.log("is");
            document.execCommand("formatBlock", false, "<p>");
        } else {
            console.log("isNot");
            document.execCommand("formatBlock", false, "<" + value + ">");
        }
    }, function (value) {
        var selection = window.getSelection();
        var blockElement = $(window.getSelection().focusNode).blockParent();
        return blockElement.is(value);
    });

    KOALA.Editor = function (element, settings) {
        this.element = element;
        this.html = element.html();
        this.settings = settings;
        this.toolbar = null;
        this.textWindow = null;
        this.codeWindow = null;
        this.formControl = null;
    };

    KOALA.Editor.prototype.init = function () {

        var editor = this;

        if (this.element.is('input, textarea')) {
            this.formControl = this.element;
            this.html = this.formControl.val();
            var newDiv = $('<div />');
            this.formControl.after(newDiv);
            this.formControl.hide();
            this.element = newDiv;
        }

        this.element.addClass('ke-box');
        this.element.html("");

        if (this.settings.theme) {
            this.element.addClass(this.settings.theme);
        }

        this.toolbar = $('<div />', {
            "class": "ke-toolbar"
        });
        $.each(this.settings.buttons, function (index, value) {
            if (value == "sep") {
                editor.toolbar.append($('<div />').addClass("sep"));
            } else if (KOALA.buttons[value]) {
                var button = KOALA.buttons[value].render();
                button.data("button", KOALA.buttons[value]);
                editor.toolbar.append(button);
            }

        });
        this.element.append(this.toolbar);

        this.toolbar.on('mousedown', 'button', function () {
            if (!KOALA.buttons[$(this).attr('data-name')].options.options) {
                KOALA.buttons[$(this).attr('data-name')].do(editor, $(this).parent(), null);
            }
        });

        this.toolbar.on('mousedown', '.ke-dropdown li', function (e) {
            e.preventDefault();
            KOALA.buttons[$(this).attr("data-button")].do(editor, $(this).parents(".ke-toolbar-button"), $(this).attr("data-value"));
        });

        this.textWindow = $('<div />', {
            "class": "ke-editor",
            "contenteditable": ""
        });
        this.textWindow.html(this.getHTML());
        this.element.append(this.textWindow);

        this.textWindow.on('input', function () {
            editor.html = editor.textWindow.html();
            if (editor.formControl) {
                editor.formControl.val(editor.getHTML());
            }
            if (editor.html == "") {
                editor.textWindow.html("<p><br /></p>");
                editor.setCursor(0, 1);
            }
        });

        this.textWindow.trigger('input');

        this.textWindow.click(function () {
            $('.editing-image button').remove();
            $('img.selected').unwrap();
            $('img.selected').removeClass('selected');
        });

        // Handle images
        this.textWindow.on('click', 'img', function (e) {
            e.stopPropagation();
            $(this).addClass('selected');
            $(this).wrap('<div class="editing-image"></div>');
            var wrapper = $(this).parent();
            console.log(wrapper);
            var button = $('<button contenteditable="false">Editar</button>');
            console.log(button);
            wrapper.append(button);
            img = $(this);
            button.click(function () {
                width = prompt("Comprimento");
                img.css('width', parseInt(width));
            });
            /**/
        });

        this.textWindow.on('selectstart', function () {
            $(document).one('mouseup keyup', function () {
                editor.toolbar.find('.ke-toolbar-button').each(function (index) {
                    if (KOALA.buttons[$(this).attr('data-name')].isActive(KOALA.buttons[$(this).attr('data-name')].options.value)) {
                        $(this).addClass("active");
                    } else {
                        $(this).removeClass("active");
                    }
                });
            });
        });

        this.codeWindow = $('<pre />', {
            "class": "ke-code",
            "contenteditable": ""
        });
        this.element.append(this.codeWindow);

        document.execCommand('defaultParagraphSeparator', false, 'p');

    };

    KOALA.Editor.prototype.getHTML = function () {
        return this.html;
    }

    KOALA.Editor.prototype.setHTML = function (html) {
        this.textWindow.html(html);
        this.codeWindow.text(html);
        this.html = html;
    }

    KOALA.Editor.prototype.destroy = function () {
        if (this.formControl) {
            this.element.remove();
            this.formControl.show();
        }
    }

    KOALA.Editor.prototype.setCursor = function (row, column) {
        var range = document.createRange();
        var sel = window.getSelection();
        range.setStart(this.textWindow[0].childNodes[row], column);
        range.collapse(true);
        sel.removeAllRanges();
        sel.addRange(range);
    }

    $.fn.koala = function (options) {


        if (this.data('koala')) {
            return this.data('koala');
        }

        // This is the easiest way to have default options.
        var settings = $.extend({
            buttons: ['bold', 'italic', 'underline', 'sep', 'formatBlock', 'ul', 'ol', 'image', 'link', 'unlink', 'sep', 'undo', 'redo', 'sep', 'code']
        }, options);

        var editor = new KOALA.Editor(this, settings);

        this.data('koala', editor);

        editor.init();

        return editor;
    };

}(jQuery));