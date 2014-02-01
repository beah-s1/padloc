Polymer("padlock-header", {
    view: null,
    filterString: "",
    observe: {
        filterString: "updateIcons",
        view: "updateIcons",
        record: "updateIcons"
    },
    //* Updates the icon shapes for the left and right header button
    updateIcons: function() {
        if (this.view && this.view.headerOptions.showFilter && this.filterString) {
            // In case the filter input is showing, view preferences are overwritten
            this.$.leftIcon.shape = "";
            this.$.rightIcon.shape = "cancel";
        } else {
            // The current view provides the icon shapes it wants
            this.$.leftIcon.shape = this.view.headerOptions.leftIconShape;
            this.$.rightIcon.shape = this.view.headerOptions.rightIconShape;
        }
    },
    //* The left button was clicked. Delegates to the corresponding view method
    leftClicked: function() {
        if (this.view && this.view.leftHeaderButton) {
            this.view.leftHeaderButton();
        }
    },
    /**
     * The right button was clicked. Resets the filter string if the filter input is showing,
     * delegates to view method otherwise
     */
    rightClicked: function() {
        if (this.view && this.view.headerOptions.showFilter && this.filterString) {
            this.filterString = "";
            this.$.filterInput.blur();
        } else if (this.view && this.view.rightHeaderButton) {
            this.view.rightHeaderButton();
        }
    },
    blurFilterInput: function() {
        this.$.filterInput.blur();
    }
});