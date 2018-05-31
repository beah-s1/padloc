import "../styles/shared.js";
import { BaseElement, html } from "./base.js";
import "./dialog.js";
import "./promo.js";

class PlPromoDialog extends BaseElement {
    static get template() {
        return html`
        <style include="shared">
            :host {
                --pl-dialog-inner: {
                    background: linear-gradient(180deg, #555 0%, #222 100%);
                };
            }
        </style>

        <pl-dialog id="dialog" on-dialog-dismiss="_dismiss">
            <pl-promo promo="[[ promo ]]" on-promo-expire="_dismiss" on-promo-redeem="_redeem"></pl-promo>
        </pl-dialog>
`;
    }

    static get is() {
        return "pl-promo-dialog";
    }

    static get properties() {
        return {
            promo: Object
        };
    }

    _dismiss() {
        this.$.dialog.open = false;
        typeof this._resolve === "function" && this._resolve(false);
        this._resolve = null;
    }

    _redeem() {
        this.$.dialog.open = false;
        typeof this._resolve === "function" && this._resolve(true);
        this._resolve = null;
    }

    show() {
        setTimeout(() => (this.$.dialog.open = true), 10);

        return new Promise(resolve => {
            this._resolve = resolve;
        });
    }
}

window.customElements.define(PlPromoDialog.is, PlPromoDialog);
