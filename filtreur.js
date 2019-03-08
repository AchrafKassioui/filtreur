////////////////////////////////////////////////////////////////////////
//
// Filtreur.js
// 0.9 Beta
// 8 March 2019
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

    var supports = !!document.addEventListener && !!document.querySelector && !!Array.prototype.filter && !!Array.prototype.includes;
    var filtreur = {};

    ////////////////////////////////////////////////////////////////////////
    //
    // Default settings
    //
    ////////////////////////////////////////////////////////////////////////

    filtreur.all = 'all';
    filtreur.unfiltered = 'unfiltered';
    filtreur.filtered = 'filtered';
    filtreur.button_selected = 'selected';
    filtreur.toggle = true;
    filtreur.escape = true;
    filtreur.keyboard = false;
    filtreur.keycodes = {};

    ////////////////////////////////////////////////////////////////////////
    //
    // Private methods
    //
    ////////////////////////////////////////////////////////////////////////

    function unFilter(data) {
        data.filter = filtreur.current = filtreur.all;

        getItems(data.collection).filter(function (item) {
            if (item.classList.contains(filtreur.unfiltered)) item.classList.remove(filtreur.unfiltered);
            if (item.classList.contains(filtreur.filtered)) item.classList.remove(filtreur.filtered);
        });

        filtreur.collection = null;

        updateUI(data);

        if (filtreur.callback_end) filtreur.callback_end();
    }

    function updateUI(data) {
        getButtons(data.collection).filter(function (button) {
            var filters = button.getAttribute('data-filter').split(' ');
            var hasCategory = (filters.indexOf(data.filter) > -1);
            var isSelectBox = button.parentElement.selectedIndex;

            if (hasCategory) {
                if (isSelectBox != undefined) button.setAttribute('selected', 'true');
                else button.classList.add(filtreur.button_selected);
            } else {
                if (isSelectBox != undefined) button.removeAttribute('selected');
                button.classList.remove(filtreur.button_selected);
            }
        });
    }

    function getItems(collection){
        var items = Array.prototype.slice.call(document.querySelectorAll('[data-collection=' + collection +'] *'));
        return items;
    }

    function getButtons(collection){
        var buttons = Array.prototype.slice.call(document.querySelectorAll('[data-filter-in=' + collection +']'));
        return buttons;
    }

    function setupKeyboardShortcuts(){
        var buttons = Array.prototype.slice.call(document.querySelectorAll('[data-filter-keycode]'));
        if(!buttons) return;

        filtreur.keyboard = true;

        buttons.filter(function(button){
            var keycode = button.getAttribute('data-filter-keycode');

            var filter = button.getAttribute('data-filter');
            if(!filter){
                var obj = {item: button};
                return console.warn('Filtreur:', obj.item, ' has no "data-filter" attribute');
            }

            var collection = button.getAttribute('data-filter-in');
            if(!collection){
                var obj = {item: button};
                return console.warn('Filtreur:', obj.item, ' has no "data-filter-in" attribute');
            }

            filtreur.keycodes[keycode] = 1;
        });
    }

    ////////////////////////////////////////////////////////////////////////
    //
    // API
    //
    ////////////////////////////////////////////////////////////////////////

    filtreur.filter = function (data) {
        if (data.filter === filtreur.all && filtreur.current === filtreur.all) return;

        if (filtreur.toggle && data.filter === filtreur.current) return unFilter(data);

        filtreur.current = data.filter;

        if (filtreur.current === filtreur.all) return unFilter(data);

        getItems(data.collection).filter(function (item) {
            if (!(item.hasAttribute('data-filter') && !item.hasAttribute('data-filter-in'))) return;
            var filters = item.getAttribute('data-filter').split(' ');
            var hasCategory = (filters.indexOf(data.filter) > -1);

            if (!hasCategory) {
                item.classList.add(filtreur.unfiltered);
                item.classList.remove(filtreur.filtered);
            } else {
                item.classList.remove(filtreur.unfiltered);
                item.classList.add(filtreur.filtered);
            }
        });

        filtreur.collection = data.collection;

        updateUI(data);

        if (filtreur.callback_start) filtreur.callback_start();
    }

    ////////////////////////////////////////////////////////////////////////
    //
    // Event handler
    //
    ////////////////////////////////////////////////////////////////////////

    function eventHandler(e) {
        if (e.type === 'click') {
            var isButton = e.target.hasAttribute('data-filter-in');
            var hasFilter = e.target.hasAttribute('data-filter');
            if (!isButton || !hasFilter) return;

            filtreur.filter({
                filter: e.target.dataset.filter,
                collection: e.target.dataset.filterIn
            });
        }

        if (e.type === 'change') {
            var isSelectBox = e.target.selectedIndex;
            var isButton = e.target.options[e.target.selectedIndex].hasAttribute('data-filter-in');
            var hasFilter = e.target.options[e.target.selectedIndex].hasAttribute('data-filter');
            if (!((isSelectBox != undefined) && isButton && hasFilter)) return;

            filtreur.filter({
                filter: e.target.options[e.target.selectedIndex].dataset.filter,
                collection: e.target.options[e.target.selectedIndex].dataset.filterIn
            });
        }

        if (e.type === 'keydown') {
            var modifiers = e.ctrlKey || e.shiftKey || e.altKey;

            if (filtreur.keyboard && filtreur.keycodes[e.keyCode] && !modifiers){
                var button = document.querySelector('[data-filter-keycode="' + e.keyCode + '"]');

                filtreur.filter({
                    filter: button.getAttribute('data-filter'),
                    collection: button.getAttribute('data-filter-in')
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

    if (!supports) return console.warn('Filtreur.js is not supported on this browser');

    setupKeyboardShortcuts();

    document.addEventListener('click', eventHandler, false);
    document.addEventListener('change', eventHandler, false);
    document.addEventListener('keydown', eventHandler, false);

    console.log('Filtreur is running');

    return filtreur;
});
