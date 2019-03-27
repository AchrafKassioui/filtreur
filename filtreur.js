////////////////////////////////////////////////////////////////////////
//
// Filtreur.js
// 0.9 Beta
// 27 March 2019
//
// www.achrafkassioui.com/filtreur/
//
// Copyright (C) 2019 Achraf Kassioui
//
// This program is free software: you can redistribute it and/or modify
// it under the terms of the GNU General Public License as published by
// the Free Software Foundation, either version 3 of the License, or any
// later version.
//
// This program is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
// GNU General Public License for more details.
//
// https://www.gnu.org/licenses/gpl-3.0.en.html
//
////////////////////////////////////////////////////////////////////////

(function(root, factory){
    if(typeof define === 'function' && define.amd){
        define([], function(){
            return factory(root);
        });
    }else if(typeof exports === 'object'){
        module.exports = factory(root);
    }else{
        root.filtreur = factory(root);
    }
})(typeof global !== 'undefined' ? global : typeof window !== 'undefined' ? window : this, function(window){
    'use strict';
    ////////////////////////////////////////////////////////////////////////
    //
    // Variables
    //
    ////////////////////////////////////////////////////////////////////////

    var supports = !!document.addEventListener && !!document.querySelector && !!Array.prototype.filter;
    var filtreur = {};

    filtreur.keycodes = {};
    filtreur.running = false;

    ////////////////////////////////////////////////////////////////////////
    //
    // Default settings
    //
    ////////////////////////////////////////////////////////////////////////

    filtreur.all = 'all';
    filtreur.filtered_out = 'filtered_out';
    filtreur.filtered_in = 'filtered_in';
    filtreur.selected_filter = 'selected_filter';
    filtreur.toggle = true;
    filtreur.escape = true;

    ////////////////////////////////////////////////////////////////////////
    //
    // HTML API
    //
    ////////////////////////////////////////////////////////////////////////

    var data_attribute_filter = 'data-filter';
    var data_attribute_filter_in = 'data-filter-in';
    var data_attribute_collection = 'data-collection';
    var data_attribute_keycode = 'data-filter-keycode';

    ////////////////////////////////////////////////////////////////////////
    //
    // Private methods
    //
    ////////////////////////////////////////////////////////////////////////

    function unFilter(data) {
        data.filter = filtreur.current_filter = filtreur.all;

        getItems(data.collection).filter(function (item) {
            if (item.classList.contains(filtreur.filtered_out)) item.classList.remove(filtreur.filtered_out);
            if (item.classList.contains(filtreur.filtered_in)) item.classList.remove(filtreur.filtered_in);
        });

        filtreur.collection = null;

        if (filtreur.callback_end) filtreur.callback_end();

        updateControls(data);
    }

    function updateControls(data) {
        getControls(data.collection).filter(function (control) {
            var filters = control.getAttribute(data_attribute_filter);
            if (!filters) return;
            
            var hasCategory = (filters.indexOf(data.filter) > -1);
            var isSelectBox = control.parentElement.selectedIndex;

            if (hasCategory) {
                if (isSelectBox != undefined) control.setAttribute('selected', 'true');
                else control.classList.add(filtreur.selected_filter);
            } else {
                if (isSelectBox != undefined) control.removeAttribute('selected');
                control.classList.remove(filtreur.selected_filter);
            }
        });
    }

    function getItems(collection){
        var children = Array.prototype.slice.call(document.querySelectorAll('[' + data_attribute_collection + '=' + collection +'] *'));
        var items = children.filter(function(item){
            return (item.hasAttribute(data_attribute_filter) && !item.hasAttribute(data_attribute_filter_in));
        });
        return items;
    }

    function getControls(collection){
        var controls = Array.prototype.slice.call(document.querySelectorAll('[' + data_attribute_filter_in + '=' + collection +']'));
        return controls;
    }

    function getKeyboardShortcuts(){
        var controls_with_keycodes = Array.prototype.slice.call(document.querySelectorAll('[' + data_attribute_keycode + ']'));
        if (!controls_with_keycodes) return;

        controls_with_keycodes.filter(function(control){
            if (!control.getAttribute(data_attribute_filter_in)) {
                var obj = {item: control};
                return console.warn('Filtreur:', obj.item, ' has no ' + JSON.stringify(data_attribute_filter_in) + ' attribute');
            }else{
                var keycode = control.getAttribute(data_attribute_keycode);
                filtreur.keycodes[keycode] = 1;
            }
        });
    }

    function sanitize(){
        var controls = Array.prototype.slice.call(document.querySelectorAll('[' + data_attribute_filter_in + ']'));
        if (!controls) return;

        controls.filter(function(control){
            var filter = control.getAttribute(data_attribute_filter);
            if (!filter) {
                var obj = {item: control};
                return console.warn('Filtreur:', obj.item, ' has no ' + JSON.stringify(data_attribute_filter) + ' attribute');
            }
        });
    };

    ////////////////////////////////////////////////////////////////////////
    //
    // API
    //
    ////////////////////////////////////////////////////////////////////////

    filtreur.filter = function (data) {
        if (data.filter === filtreur.all && filtreur.current_filter === filtreur.all) return;

        if (filtreur.toggle && data.filter === filtreur.current_filter && data.collection === filtreur.collection) return unFilter(data);

        filtreur.current_filter = data.filter;

        if (filtreur.current_filter === filtreur.all) return unFilter(data);

        getItems(data.collection).filter(function (item) {
            var filters = item.getAttribute(data_attribute_filter).split(' ');
            var hasCategory = (filters.indexOf(data.filter) > -1);

            if (!hasCategory) {
                item.classList.add(filtreur.filtered_out);
                item.classList.remove(filtreur.filtered_in);
            } else {
                item.classList.remove(filtreur.filtered_out);
                item.classList.add(filtreur.filtered_in);
            }
        });

        filtreur.collection = data.collection;

        if (filtreur.callback_start) filtreur.callback_start();

        updateControls(data);
    }

    filtreur.stop = function(){
        if(filtreur.running === false) return;

        filtreur.keycodes = {};

        document.removeEventListener('click', eventHandler, false);
        document.removeEventListener('change', eventHandler, false);
        document.removeEventListener('keydown', eventHandler, false);

        filtreur.running = false;
        return console.log('Filtreur has been stopped');
    };

    filtreur.start = function(){
        if (!supports) return console.log('Filtreur.js is not supported on this browser');
        filtreur.stop();
        sanitize();

        getKeyboardShortcuts();

        document.addEventListener('click', eventHandler, false);
        document.addEventListener('change', eventHandler, false);
        document.addEventListener('keydown', eventHandler, false);

        filtreur.running = true;
        return console.log('Filtreur is running');
    };

    ////////////////////////////////////////////////////////////////////////
    //
    // Event handler
    //
    ////////////////////////////////////////////////////////////////////////

    function eventHandler(e) {
        if (e.type === 'click') {
            var isControl = e.target.hasAttribute(data_attribute_filter_in);
            var hasFilter = e.target.hasAttribute(data_attribute_filter);
            if (!isControl || !hasFilter) return;

            filtreur.filter({
                filter: e.target.getAttribute(data_attribute_filter),
                collection: e.target.getAttribute(data_attribute_filter_in)
            });
        }

        if (e.type === 'change') {
            var isSelectBox = e.target.selectedIndex;
            var isControl = e.target.options[e.target.selectedIndex].hasAttribute(data_attribute_filter_in);
            var hasFilter = e.target.options[e.target.selectedIndex].hasAttribute(data_attribute_filter);
            if (!((isSelectBox != undefined) && isControl && hasFilter)) return;

            filtreur.filter({
                filter: e.target.options[e.target.selectedIndex].getAttribute(data_attribute_filter),
                collection: e.target.options[e.target.selectedIndex].getAttribute(data_attribute_filter_in)
            });
        }

        if (e.type === 'keydown') {
            var modifiers = e.ctrlKey || e.shiftKey || e.altKey;

            if (filtreur.keycodes[e.keyCode] && !modifiers){
                var control = document.querySelector('[' + data_attribute_keycode + '="' + e.keyCode + '"]');

                filtreur.filter({
                    filter: control.getAttribute(data_attribute_filter),
                    collection: control.getAttribute(data_attribute_filter_in)
                });
            }

            if (filtreur.escape && e.keyCode === 27 && filtreur.collection && !modifiers) {
                unFilter({
                    collection: filtreur.collection
                });
            }
        }
    }

    ////////////////////////////////////////////////////////////////////////
    //
    // Initialize
    //
    ////////////////////////////////////////////////////////////////////////

    filtreur.start();

    return filtreur;
});

/*

To do

- Refactor sanitize() and getKeyboardShortcuts()
- Should controls accept multiple filters?
- Bug (unidentified): sometimes hitting escape to unfilter a select box does not select the all option

*/
