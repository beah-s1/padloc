import { localize as $l } from "@padloc/core/lib/locale.js";
import { ErrorCode } from "@padloc/core/lib/error.js";
import { app } from "../init.js";
import { element, html, property, query } from "./base.js";
import { StartForm, sharedStyles } from "./start-form.js";
import { Input } from "./input.js";
import { LoadingButton } from "./loading-button.js";
import { alert, choose, prompt } from "../dialog.js";
import { passwordStrength } from "../util.js";
import "./logo.js";

@element("pl-recover")
export class Recover extends StartForm {
    @property()
    private _weakPassword = false;

    @query("#emailInput")
    private _emailInput: Input;
    @query("#passwordInput")
    private _passwordInput: Input;
    @query("#repeatPasswordInput")
    private _repeatPasswordInput: Input;
    @query("#submitButton")
    private _submitButton: LoadingButton;

    async reset() {
        this._emailInput.value = "";
        this._passwordInput.value = "";
        this._repeatPasswordInput.value = "";
        this._submitButton.stop();
        super.reset();
    }

    render() {
        return html`
            ${sharedStyles}

            <style include="shared">
                h1 {
                    display: block;
                    text-align: center;
                    margin: 30px;
                }

                .title {
                    width: 300px;
                    margin: 30px auto;
                    font-size: var(--font-size-small);
                    font-weight: bold;
                    letter-spacing: 0.5px;
                    padding: 0 10px;
                }

                #submitButton {
                    margin-bottom: 30px;
                }

                .login {
                    text-decoration: underline;
                    cursor: pointer;
                }

                .hint.recovery-notes {
                    text-align: left;
                    padding: 15px;
                    margin: 10px;
                }

                .recovery-notes ul {
                    list-style: disc;
                }

                .recovery-notes li {
                    margin: 10px 20px 0 20px;
                }
            </style>

            <div flex></div>

            <form>

                <h1 class="animate">${$l("Recover Account")}</h1>

                <div class="title animate">
                    ${$l("Please enter your email address and new master password.")}
                </div>

                <pl-input
                    id="emailInput"
                    type="email"
                    required
                    .label=${$l("Email Address")}
                    class="tiles-2 animate"
                    @enter=${() => this._submit()}>
                </pl-input>

                <pl-input
                    id="passwordInput"
                    type="password"
                    required
                    .label=${$l("New Master Password")}
                    class="tiles-2 animate"
                    @change=${() => this._updatePwdStrength()}
                    @enter=${() => this._submit()}>
                </pl-input>

                <div class="hint warning" ?hidden=${!this._weakPassword}>${$l("WARNING: Weak Password!")}</div>

                <pl-input
                    id="repeatPasswordInput"
                    type="password"
                    required
                    .label=${$l("Repeat Master Password")}
                    class="tiles-2 animate"
                    @enter=${() => this._submit()}>
                </pl-input>

                <div class="hint warning animate recovery-notes tiles-5">
                    ${$l(
                        "IMPORTANT, READ CAREFULLY: Padloc is designed in a way that makes it impossible " +
                            "for us to access the data encrypted in any of your vaults even if we wanted to. " +
                            "While this is essential to ensuring the security of your data, it also has the " +
                            "following implications:"
                    )}
                    <ul>
                        <li>
                            ${$l(
                                "Any data stored in your private vault can not be recovered and will be permantently lost."
                            )}
                        </li>
                        <li>
                            ${$l(
                                "Any shared vaults owned by you will be archived. You may unarchive them later, " +
                                    "but any data stored in them will be lost in the process. If there are any other " +
                                    "members with access to those vaults, we recommend asking them to create a backup " +
                                    "of the data so it may be restored later."
                            )}
                        </li>
                        <li>
                            ${$l(
                                "If you are a member of any shared vaults that you are not the owner of, your " +
                                    "membership will be suspended and you will temporarily lose access to any data " +
                                    "stored in those vaults until your membership is confirmed."
                            )}
                        </li>
                    </ul>
                </div>

                <pl-loading-button id="submitButton" class="tap tiles-3 animate" @click=${() => this._submit()}>
                    ${$l("Recover Account")}
                </pl-loading-button>

            </form>

            <div flex></div>
        `;
    }

    private async _submit() {
        if (this._submitButton.state === "loading") {
            return;
        }

        this._emailInput.blur();
        this._passwordInput.blur();

        if (this._emailInput.invalid) {
            await alert(this._emailInput.validationMessage || $l("Please enter a valid email address!"), {
                type: "warning"
            });
            return;
        }

        if (!this._passwordInput.value) {
            await alert($l("Please enter a master password!"), { type: "warning" });
            return;
        }

        if (this._passwordInput.value !== this._repeatPasswordInput.value) {
            await alert($l("You didn't repeat your master password correctly. Try again!"), { type: "warning" });
            return;
        }

        const email = this._emailInput.value;
        const password = this._passwordInput.value;

        const strength = await passwordStrength(password);
        if (strength.score < 2) {
            const choice = await choose(
                $l(
                    "The password you entered is weak which makes it easier for attackers to break " +
                        "the encryption used to protect your data. Try to use a longer password or include a " +
                        "variation of uppercase, lowercase and special characters as well as numbers!"
                ),
                [$l("Learn More"), $l("Choose Different Password"), $l("Use Anyway")],
                {
                    type: "warning",
                    title: $l("WARNING: Weak Password"),
                    hideIcon: true,
                    preventDismiss: true
                }
            );
            switch (choice) {
                case 0:
                    this._openPwdHowTo();
                    return;
                case 1:
                    this._passwordInput.focus();
                    return;
            }
        }

        await app.verifyEmail(email);

        return this._recover(email, password, name);
    }

    private async _recover(email: string, password: string, name: string): Promise<void> {
        this._submitButton.start();

        const verify = await prompt(
            $l(
                "To complete the account recovery process, please enter " +
                    "the confirmation code sent to your email address!"
            ),
            { placeholder: "Enter Confirmation Code", confirmLabel: "Submit" }
        );

        if (verify === null) {
            this._submitButton.stop();
            return;
        }

        try {
            await app.recoverAccount({ email, password, verify });
            this._submitButton.success();
            await alert($l("Account recovery successful!"), { type: "success" });
            this.dispatch("login", { email });
        } catch (e) {
            this._submitButton.fail();
            switch (e.code) {
                case ErrorCode.EMAIL_VERIFICATION_FAILED:
                    switch (
                        await choose(
                            $l("Wrong confirmation code. Please try again!"),
                            [$l("Try Again"), $l("Resend Email"), $l("Cancel")],
                            { type: "warning", title: $l("Invalid Validation Code!") }
                        )
                    ) {
                        case 0:
                            return this._recover(email, password, name);
                        case 1:
                            return this._submit();
                        default:
                            return;
                    }
                default:
                    throw e;
            }
        }
    }

    private async _updatePwdStrength() {
        const pwd = this._passwordInput.value;
        const result = await passwordStrength(pwd);
        const score = result.score;
        this._weakPassword = score < 3;
    }

    private _openPwdHowTo() {
        window.open("https://padlock.io/howto/choose-master-password/", "_system");
    }
}