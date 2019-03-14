////////////////////////////////////////////////////////////////////////
//
// Filtreur.js
// 0.9 Beta
// 14 March 2019
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
    filtreur.filtered_out = 'filtered_out';
    filtreur.filtered_in = 'filtered_in';
    filtreur.control_selected = 'selected';
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
            if (item.classList.contains(filtreur.filtered_out)) item.classList.remove(filtreur.filtered_out);
            if (item.classList.contains(filtreur.filtered_in)) item.classList.remove(filtreur.filtered_in);
        });

        filtreur.collection = null;

        updateUI(data);

        if (filtreur.callback_end) filtreur.callback_end();
    }

    function updateUI(data) {
        getControls(data.collection).filter(function (control) {
            var filters = control.getAttribute('data-filter').split(' ');
            var hasCategory = (filters.indexOf(data.filter) > -1);
            var isSelectBox = control.parentElement.selectedIndex;

            if (hasCategory) {
                if (isSelectBox != undefined) control.setAttribute('selected', 'true');
                else control.classList.add(filtreur.control_selected);
            } else {
                if (isSelectBox != undefined) control.removeAttribute('selected');
                control.classList.remove(filtreur.control_selected);
            }
        });
    }

    function getItems(collection){
        var items = Array.prototype.slice.call(document.querySelectorAll('[data-collection=' + collection +'] *'));
        return items;
    }

    function getControls(collection){
        var controls = Array.prototype.slice.call(document.querySelectorAll('[data-filter-in=' + collection +']'));
        return controls;
    }

    function setupKeyboardShortcuts(){
        var controls = Array.prototype.slice.call(document.querySelectorAll('[data-filter-keycode]'));
        if(!controls) return;

        filtreur.keyboard = true;

        controls.filter(function(control){
            var keycode = control.getAttribute('data-filter-keycode');

            var filter = control.getAttribute('data-filter');
            if(!filter){
                var obj = {item: control};
                return console.warn('Filtreur:', obj.item, ' has no "data-filter" attribute');
            }

            var collection = control.getAttribute('data-filter-in');
            if(!collection){
                var obj = {item: control};
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
                item.classList.add(filtreur.filtered_out);
                item.classList.remove(filtreur.filtered_in);
            } else {
                item.classList.remove(filtreur.filtered_out);
                item.classList.add(filtreur.filtered_in);
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
            var isControl = e.target.hasAttribute('data-filter-in');
            var hasFilter = e.target.hasAttribute('data-filter');
            if (!isControl || !hasFilter) return;

            filtreur.filter({
                filter: e.target.dataset.filter,
                collection: e.target.dataset.filterIn
            });
        }

        if (e.type === 'change') {
            var isSelectBox = e.target.selectedIndex;
            var isControl = e.target.options[e.target.selectedIndex].hasAttribute('data-filter-in');
            var hasFilter = e.target.options[e.target.selectedIndex].hasAttribute('data-filter');
            if (!((isSelectBox != undefined) && isControl && hasFilter)) return;

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

/*

To do

- Should controls accept multiple filters?
- Similar control keycodes should work on all collections.
- filtreur.live option. I false, store the controls and items in a variable on startup.

*/
