(function (namespace, $) {
    "use strict";

    var Demo = function () {
        // Create reference to this instance
        var o = this;
        // Initialize app when document is ready
        $(document).ready(function () {
            o.initialize();
        });

    };
    var p = Demo.prototype;

    // =========================================================================
    // INIT
    // =========================================================================

    p.initialize = function () {
        this._enableEvents();

        this._initButtonStates();
        this._initIconSearch();
        this._initInversedTogglers();
        this._initChatMessage();
    };

    // =========================================================================
    // EVENTS
    // =========================================================================

    // events
    p._enableEvents = function () {
        var o = this;

        $('.card-head .tools .btn-refresh').on('click', function (e) {
            o._handleCardRefresh(e);
        });
        $('.card-head .tools .btn-collapse').on('click', function (e) {
            o._handleCardCollapse(e);
        });
        $('.card-head .tools .btn-close').on('click', function (e) {
            o._handleCardClose(e);
        });
        $('.card-head .tools .menu-card-styling a').on('click', function (e) {
            o._handleCardStyling(e);
        });
        $('.theme-selector a').on('click', function (e) {
            o._handleThemeSwitch(e);
        });
    };

    // =========================================================================
    // CARD ACTIONS
    // =========================================================================

    p._handleCardRefresh = function (e) {
        var o = this;
        var card = $(e.currentTarget).closest('.card');
        materialadmin.AppCard.addCardLoader(card);
        setTimeout(function () {
            materialadmin.AppCard.removeCardLoader(card);
        }, 1500);
    };

    p._handleCardCollapse = function (e) {
        var card = $(e.currentTarget).closest('.card');
        materialadmin.AppCard.toggleCardCollapse(card);
    };

    p._handleCardClose = function (e) {
        var card = $(e.currentTarget).closest('.card');
        materialadmin.AppCard.removeCard(card);
    };

    p._handleCardStyling = function (e) {
        // Get selected style and active card
        var newStyle = $(e.currentTarget).data('style');
        var card = $(e.currentTarget).closest('.card');

        // Display the selected style in the dropdown menu
        $(e.currentTarget).closest('ul').find('li').removeClass('active');
        $(e.currentTarget).closest('li').addClass('active');

        // Find all cards with a 'style-' class
        var styledCard = card.closest('[class*="style-"]');

        if (styledCard.length > 0 && (!styledCard.hasClass('style-white') && !styledCard.hasClass('style-transparent'))) {
            // If a styled card is found, replace the style with the selected style
            // Exclude style-white and style-transparent
            styledCard.attr('class', function (i, c) {
                return c.replace(/\bstyle-\S+/g, newStyle);
            });
        }
        else {
            // Create variable to check if a style is switched
            var styleSwitched = false;

            // When no cards are found with a style, look inside the card for styled headers or body
            card.find('[class*="style-"]').each(function () {
                // Replace the style with the selected style
                // Exclude style-white and style-transparent
                if (!$(this).hasClass('style-white') && !$(this).hasClass('style-transparent')) {
                    $(this).attr('class', function (i, c) {
                        return c.replace(/\bstyle-\S+/g, newStyle);
                    });
                    styleSwitched = true;
                }
            });

            // If no style is switched, add 1 to the main Card
            if (styleSwitched === false) {
                card.addClass(newStyle);
            }
        }
    };

    addCardLoader = function(card) {
        var container = $('<div class="card-loader"></div>').appendTo(card);
        container.hide().fadeIn();
        var opts = {
            lines: 17,
            length: 0,
            width: 3,
            radius: 6,
            corners: 1,
            rotate: 13,
            direction: 1,
            color: '#000',
            speed: 2,
            trail: 76,
            shadow: false,
            hwaccel: false,
            className: 'spinner',
            zIndex: 2e9
        };
        var spinner = new Spinner(opts).spin(container.get(0));
        card.data('card-spinner', spinner);
    }
});