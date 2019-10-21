/*\
title: $:/plugins/tgrosinger/tw5-checklist/checkbox-wikirule.js
type: application/javascript
module-type: wikirule
\*/

(function(){

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

exports.name = "checkbox";
exports.types = {inline: true};

exports.init = function(parser) {
    this.parser = parser;

    // Match on [ ], [x], and [X], to the end of the line
    // Match on * [ ], * [x], and * [X] for indented lines
    this.matchRegExp = /(^\[([ xX])\] .*$|^(\*) \[([ xX])\] .*$)/mg;
};

/*
Retrieve the configuration state of the clear all button
*/

exports.shouldShowClearAll = function() {
    var configWidgetTitle = "$:/plugins/tgrosinger/tw5-checklist/Configuration";
    var configWidgetFields = $tw.wiki.getTiddler(configWidgetTitle).fields;

    var showClearAll = configWidgetFields["show-clearall"] || "true";
    return (showClearAll === "true");
}

/*
Create list items
*/

exports.parse = function() {
    let listItems = [];
    let listStartPos = this.parser.pos;
    let match = this.match;

    // Start the list with a "New List Item" placeholder
    listItems.push({
        type: "element",
        tag: "li",
        children: [
            {
                type: "element",
                tag: "span",
                attributes: {
                    class: {type: "string", value: "checklist-newitem-icon"},
                    for: {type: "string", value: "checklist-new"}
                }
            },
            {
                type: "element",
                tag: "input",
                attributes: {
                    class: {type: "string", value: "checklist-newitem"},
                    id: {type: "string", value: "checklist-new"},
                    placeholder: {type: "string", value: "New list item (WikiText)"}
                    // impossible? add an aria-label "Write a new todo item"
                    // attribute aria-label seems to be missing in $:/core/modules/widgets/edit.js 
                }
            },
            // label for the input field
            {
                type: "element",
                tag: "label",
                attributes: {
                    class: {type: "string", value: "checklist-vh"},
                    for: {type: "string", value: "checklist-new"}
                },
                children: [
                    {type: "text", text: "Write a new item for the list."}
                ]
            },
            // (pseudo) button to add the new item to the list
            {
                type: "element",
                tag: "button",
                attributes: {
                    class: {type: "string", value: "tc-btn-invisible tc-btn-mini checklist-add"},
                    title: {type: "string", value: "add to list"}
                },
                children: [
                    {
                        type: "element",
                        tag: "span",
                        attributes: {
                            class: {type: "string", value: "checklist-vh"}
                        },
                        children: [
                            {type: "text", text: "add list item"}
                        ]
                    }
                ]
            }
            // end of button
        ]
    });

    // Create items in a do-while loop
    do {
        let startPos = this.parser.pos;
        this.parser.pos = this.matchRegExp.lastIndex;
        let parseResults;
        
        // Check indent & get label sub-string
        if (match[3] === "*") {
            parseResults = this.parser.wiki.parseText(
                "text/vnd.tiddlywiki",
                this.parser.source.substring(startPos + 6, this.parser.pos),
                {parseAsInline: true}
            );
        } else {
            parseResults = this.parser.wiki.parseText(
                "text/vnd.tiddlywiki",
                this.parser.source.substring(startPos + 4, this.parser.pos),
                {parseAsInline: true}
            );
        }

        // Use the listitem body as a label for the checkbox to get better accessibility
        let itembody = {
            type: "element",
            tag: "label",
            attributes: {
                for: {type: "string", value: match.index}
            },
            children: parseResults.tree
        };

        let checkbox = {
            type: "element",
            tag: "input",
            attributes: {
                type: {type: "string", value: "checkbox"},
                pos: {type: "string", value: match.index},
                id: {type: "string", value: match.index}
            }
        };
        if (match[2] === "x" || match[2] === "X" || match[4] === "x" || match[4] === "X") {
            checkbox.attributes.checked = {type: "boolean", value: true};
        }

        // Make a button to delete the item
        let removelabel = {
            type: "element",
            tag: "span",
            attributes: {
                class: {type: "string", value: "checklist-vh"}
            },
            children: [
                {type: "text", text: "delete list item"}
            ]
        };

        let removebutton = {
            type: "element",
            tag: "button",
            attributes: {
                class: {type: "string", value: "tc-btn-invisible tc-btn-mini checklist-remove"},
                title: {type: "string", value: "delete"}
            },
            children: [
                removelabel
            ]
        };

        // Make a reusable list item
        let subitem = {
            type: "element",
            tag: "li",
            attributes: {
                class: {type: "string", value: "flex"}
            },
            children: [
                checkbox,
                itembody,
                removebutton
            ]
        };

        // Check for indent and add the item to the list
        if (match[3] === "*") {
            listItems.push({
                type: "element",
                tag: "ul",
                attributes: {
                    class: {type: "string", value: "checklist-sublist"},
                },
                children: [
                    subitem
                ]
            });
        } else { 
            listItems.push(subitem);
        }

        match = this.matchRegExp.exec(this.parser.source);
    } while (match !== null && match.index === 1 + this.parser.pos);

    // Show the Clear-All button
    if (this.shouldShowClearAll()) {
        var clearallbutton = {
            type: "element",
            tag: "button",
            attributes: {
                class: {type: "string", value: "checklist-clearall"}
            },
            children: [
                {
                    type: "element",
                    tag: "span",
                    attributes: {
                        class: {type: "string", value: "checklist-clearall-label"}
                    },
                    children: [
                        {type: "text", text: "Clear all"}
                    ]
                }
            ]
        };

        listItems.push({
            type: "element",
            tag: "li",
            children: [
                clearallbutton
            ]
        });
    }

    return [{
        type: "checklist",
        attributes: {
            listStartPos: {type: "string", value: listStartPos},
            listStopPos:  {type: "string", value: this.parser.pos}
        },
        children: listItems
    }];
};

})();
