/**
 * Created by João on 03/02/2015.
 */

var Koala = Koala || {};

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
    }

    Koala.commands = {};

    Koala.addCommand = function (name, execute, isActive) {
        Koala.commands[name] = new Koala.Command(name, execute, isActive);
    }

    Koala.getCommand = function (name) {
        if (Koala.commands[name]) {
            return Koala.commands[name];
        }
        return null;
    }

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
        console.log("$" + value + "$");
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
            editor.textWindow.html(editor.html);
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
        if (this.options.prompt) {
            value = prompt(this.options.prompt);
        }
        if (this.options.command) {
            Koala.getCommand(this.options.command).execute(editor, value);
        }
    };

    Koala.Button.prototype.render = function () {
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
                ddList.append('<li data-button="' + btn.options.name + '" data-value="' + index + '">' + label + '</li>');
            })
            dropdown.append(ddList);
            btnDiv.append(dropdown);
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
        koala.buttons[options.name] = new Koala.Button(options);
    };

    Koala.getButton = function (name) {
        if (Koala.buttons[name]) {
            return Koala.buttons[name];
        }
        return null;
    }

    /**
     * Buttons
     */

    Koala.buttons['bold'] = new Koala.Button({name: "bold", label: "Bold", icon: "fa-bold", command: "bold"});
    Koala.buttons['italic'] = new Koala.Button({name: "italic", label: "Italic", icon: "fa-italic", command: "italic"});
    Koala.buttons['underline'] = new Koala.Button({
        name: "underline",
        label: "Underline",
        icon: "fa-underline",
        command: "underline"
    });

    Koala.buttons['ol'] = new Koala.Button({
        name: "ol",
        label: "Ordered list",
        icon: "fa-list-ol",
        command: "orderedList"
    });
    Koala.buttons['ul'] = new Koala.Button({
        name: "ul",
        label: "Unordered list",
        icon: "fa-list-ul",
        command: "orderedList"
    });

    Koala.buttons['formatBlock'] = new Koala.Button({
        name: "formatBlock",
        label: "Block Style",
        icon: "fa-paragraph",
        command: "formatBlock",
        options: {
            p: "Normal",
            h1: "Heading 1"
        }
    });

    Koala.buttons['undo'] = new Koala.Button({name: "undo", label: "Undo", icon: "fa-undo", command: "undo"});
    Koala.buttons['redo'] = new Koala.Button({name: "redo", label: "Redo", icon: "fa-repeat", command: "redo"});

    Koala.buttons['image'] = new Koala.Button({
        name: "image", label: "Insert image", icon: "fa-image", command: "image", prompt: "Image URL:"
    });
    Koala.buttons['link'] = new Koala.Button({
        name: "link", label: "Link", icon: "fa-link", command: "link", prompt: "Link URL:"
    });
    Koala.buttons['unlink'] = new Koala.Button({
        name: "unlink",
        label: "Remove link",
        icon: "fa-unlink",
        command: "unlink"
    });

    Koala.buttons['code'] = new Koala.Button({name: "code", label: "View code", icon: "fa-code", command: "code"});

    Koala.Editor = function (element, settings) {
        this.element = element;
        this.html = element.html();
        this.settings = settings;
        this.toolbar = null;
        this.textWindow = null;
        this.codeWindow = null;
        this.formControl = null;
    };

    Koala.Editor.prototype.init = function () {

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
            } else if (Koala.buttons[value]) {
                var button = Koala.getButton(value).render();
                button.data("button", Koala.getButton(value));
                editor.toolbar.append(button);
            }

        });
        this.element.append(this.toolbar);

        this.toolbar.on('mousedown', 'button', function () {
            if (!Koala.buttons[$(this).attr('data-name')].options.options) {
                Koala.buttons[$(this).attr('data-name')].do(editor, $(this).parent(), null);
            }
        });

        this.toolbar.on('mousedown', '.ke-dropdown li', function (e) {
            e.preventDefault();
            Koala.buttons[$(this).attr("data-button")].do(editor, $(this).parents(".ke-toolbar-button"), $(this).attr("data-value"));
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
            var button = $('<button contenteditable="false">Edit</button>');
            console.log(button);
            wrapper.append(button);
            img = $(this);
            button.click(function () {
                width = prompt("Width");
                img.css('width', parseInt(width));
            });
            /**/
        });

        this.textWindow.on('selectstart', function () {
            $(document).one('mouseup keyup', function () {
                editor.updateToolbar();
            });
        });

        this.codeWindow = $('<pre />', {
            "class": "ke-code",
            "contenteditable": ""
        });
        this.element.append(this.codeWindow);

        document.execCommand('defaultParagraphSeparator', false, 'p');

    };

    Koala.Editor.prototype.getHTML = function () {
        return this.html;
    }

    Koala.Editor.prototype.setHTML = function (html) {
        this.textWindow.html(html);
        this.codeWindow.text(html);
        this.html = html;
    }

    Koala.Editor.prototype.destroy = function () {
        if (this.formControl) {
            this.element.remove();
            this.formControl.show();
        }
    }

    Koala.Editor.prototype.setCursor = function (row, column) {
        var range = document.createRange();
        var sel = window.getSelection();
        range.setStart(this.textWindow[0].childNodes[row], column);
        range.collapse(true);
        sel.removeAllRanges();
        sel.addRange(range);
    }

    Koala.Editor.prototype.updateToolbar = function () {
        var editor = this;
        this.toolbar.find('.ke-toolbar-button').each(function (index) {
            if (Koala.getButton($(this).attr('data-name')).isActive(editor, Koala.getButton($(this).attr('data-name')).options.value)) {
                $(this).addClass("active");
            } else {
                $(this).removeClass("active");
            }
        });
    };

    $.fn.koala = function (options) {


        if (this.data('koala')) {
            return this.data('koala');
        }

        // This is the easiest way to have default options.
        var settings = $.extend({
            buttons: ['bold', 'italic', 'underline', 'sep', 'formatBlock', 'ul', 'ol', 'image', 'link', 'unlink', 'sep', 'undo', 'redo', 'sep', 'code']
        }, options);

        var editor = new Koala.Editor(this, settings);

        this.data('koala', editor);

        editor.init();

        return editor;
    };

}(jQuery));