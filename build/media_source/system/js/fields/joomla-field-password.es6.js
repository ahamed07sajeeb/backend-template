"use strict";

((Joomla) => {
    class JoomlaFieldPassword extends HTMLElement {
        constructor() {
            super();
            if (!Joomla) {
                throw new Error('Joomla API is not properly initiated');
            }
            this.isPasswordField = true;
            this.strengthFactors = {
                'minLowercase'  : this.minLowercase,
                'minUppercase'  : this.minUppercase,
                'minIntegers'   : this.minIntegers,
                'minSymbols'    : this.minSymbols,
                'minLength'     : this.minLength,
            };
        }

        static get observedAttributes() {
            return ['value'];
        }
        /**
         * Getter and setter section
         */
        get type() {
            return this.getAttribute('type') || 'password';
        }
        
        get name() {
            return this.getAttribute('name');
        }
        
        get strengthMeter() {
            return  !!this.getAttribute('strength-meter') || false;
        }

        get inputId() {
            return this.getAttribute('id');
        }

        get customClass() {
            return this.getAttribute('custom-class') || '';
        }
        
        get inputValue() {
            return this.getAttribute('value');
        }

        set inputValue(value) {
            this.setAttribute('value', value);
        }

        get minLength() {
            return this.getAttribute('min-length') || 4;
        }
        
        get minIntegers() {
            return this.getAttribute('min-integers') || 0;
        }
        
        get minSymbols() {
            return this.getAttribute('min-symbols') || 0;
        }
        
        get minUppercase() {
            return this.getAttribute('min-uppercase') || 0;
        }

        get minLowercase() {
            return this.getAttribute('min-lowercase') || 0;
        }

        get forcePassword() {
            return this.getAttribute('force-password') || false;
        }

        get hint() {
            return this.getAttribute('hint') || false;
        }

        get autocomplete() {
            return this.getAttribute('autocomplete') || false;
        }

        get readonly() {
            return this.getAttribute('readonly') || false;
        }
        
        get disabled() {
            return this.getAttribute('disabled') || false;
        }
        
        get size() {
            return this.getAttribute('size') || 0;
        }

        get maxLength() {
            return this.getAttribute('max-length') || 99;
        }

        get required() {
            return this.getAttribute('required') || false;
        }

        get autofocus() {
            return this.getAttribute('autofocus') || false;
        }

        /**
         * Create a HTMLElement
         * @param {string} tagName      - e.g. div, strong, span etc.
         * @param {object} attr         - element attribute object
         * @param {string} innerHTML    - text to elements innerHTML
         * 
         * @return {HTMLElement}
         */
        createDOMElement =  (tagName, attr = {}, innerHTML = '') => {
            tagName     = typeof(tagName)   === 'string' && tagName.length > 0 ? tagName : false;
            attr        = typeof(attr)      === 'object' && Object.keys(attr).length ? attr : false;
            innerHTML   = typeof(innerHTML) === 'string' && innerHTML.length > 0 ? innerHTML : false;

            let _element;
            
            // IF tag name given then create element, otherwise create element div
            if (tagName) {
                _element = document.createElement(tagName);
            } else {
                _element = document.createElement("div");
            }

            // If attributes given then set attributes for the element
            if (attr) {
                Object.keys(attr).forEach(function(key) {
                    _element.setAttribute(key, attr[key]);
                });
            }

            // Add inner HTML
            if (innerHTML) {
                _element.innerHTML = innerHTML;
            }

            return _element;
        }

        /** 
         * clear all children of a specific element
         * 
         * @param {HTMLElement} - element
         * 
         * @return {void}
         */
        clearChildren = (element) => {
            while(element.firstChild) {
                element.removeChild(element.firstChild);
            }
        }

        /** 
         * Translation method to perform Joomla.JText._() API
         * 
         * @param {string} str  - language string
         * @return {string}     - translated string
         */
        translate = (str) => {
            return Joomla.JText._(str) || str;
        }

        /**
         * Password strength calculator
         * 
         * @param {string} value - password string
         * @return {integer}     - get strength value
         */
        getScore = (value) => {
            let score = 0, mods = 0;
			const sets = ['minLowercase', 'minUppercase', 'minIntegers', 'minSymbols', 'minLength'];
			for (let i = 0, l = sets.length; l>i; i++) {
				if (this.strengthFactors.hasOwnProperty(sets[i]) && this[sets[i]] > 0) {
					mods = mods + 1;
				}
            }

            score += this.calc(value, /[a-z]/g, this.minLowercase, mods);
            score += this.calc(value, /[A-Z]/g, this.minUppercase, mods);
            score += this.calc(value, /[0-9]/g, this.minIntegers, mods);
            score += this.calc(value, /[\$\!\#\?\=\;\:\*\-\_\€\%\&\(\)\`\´]/g, this.minSymbols, mods);

            if (mods == 1) {
                score += value.length > this.minLength ? 100 : 100 / this.minLength * value.length;
            } else {
                score += value.length > this.minLength ? (100 / mods) : (100 / mods) / this.minLength * value.length;
            }

            return score;
        }

        /**
         * Calculate the length according to the patterns
         * 
         * @param {string} value    - password string
         * @param {regExp} pattern  - regular expression
         * @param {integer} length  - user provided parameter i.e. how many characters, numbers, uppercase etc.
         * @param {integer} mods    - calculated mods
         * 
         * @return {integer}        - calculated length
         */
        calc = (value, pattern, length, mods) => {
            let count;
            count = value.match(pattern);
            if (count && count.length > length && length != 0) {
                return 100 / mods;
            }
            if (count && length > 0) {
                return (100 / mods) / length * count.length;
            } else {
                return 0;
            }
        }

        /** lifecycle callback for web component */
        connectedCallback() {
            
            // attach password wrapper
            this.elementContainers();
            
            // if fieldType is password then render password field
            if (this.isPasswordField) {
                this.createPasswordField('password');
            } else {
                this.createPasswordField('text');
            }

            // initialise strength indicators
            this.createStrengthIndicators();
            
            if (this.strengthMeter) {
                // check default value if provided then render score indicator 
                let score = 0;
                if (this.inputValue) {
                    score = this.getScore(this.inputValue);
                    this.indicatorsContainer.classList.add('show');
                    this.updateIndicators(score);
                } else {
                    if (this.indicatorsContainer.classList.contains('show')) {
                        this.indicatorsContainer.classList.remove('show');
                    }
                }
            }
            
        }

        /** lifecycle callback for web component */
        disconnectedCallback() {
            if (this.toggler) {
                this.toggler.removeEventListener('click', this);
            }

            if (this.inputField) {
                this.inputField.removeEventListener('keyup', this);
            }
        }

        /**
         * Create password group wrapper
         * this will create password-group, input-group, strength-indicator-container etc
         * 
         * @return {void}
         */
        elementContainers = () => {
            this.passwordGroup = this.createDOMElement('div', {class: 'password-group'});
            this.inputGroup = this.createDOMElement('div', {class: 'input-group'});
            this.indicatorsContainer = this.createDOMElement('div', {class: 'strength-indicator-container'});

            // create input container
            this.inputContainer = this.createDOMElement('div', {class: 'input-container'});

            // indicator text
            this.indicatorText = this.createDOMElement('span', {class: 'indicator-text'});
            this.indicatorsContainer.append(this.indicatorText);

            // appending
            this.inputGroup.append(this.indicatorsContainer);
            this.inputGroup.append(this.inputContainer);
            this.passwordGroup.append(this.inputGroup);
            this.append(this.passwordGroup);
        }

        /**
         * Create password input field
         * 
         * @param {string} type - field type text/password
         * 
         * @return {void}
         */
        createPasswordField = (type) => {
            // make input field's attribute 
            const attributes = {
                class: `form-control ${!!this.customClass ? this.customClass : ''}`,
                type
            };

            if (!!this.inputId) {
                attributes.id = this.inputId;
            }

            if (!!this.name) {
                attributes.name = this.name;
            }

            if (!!this.inputValue) {
                attributes.value = this.inputValue;
            }

            if (!!this.hint) {
                attributes.placeholder = this.hint;
            }

            if (!this.autocomplete) {
                attributes.autocomplete = 'off';
            }

            if (!!this.readonly) {
                attributes.readonly = 'readonly';
            }
            
            if (!!this.size) {
                attributes.size = this.size;
            }
            
            if (!!this.maxLength) {
                attributes.maxlength = this.maxLength;
            }
            
            if (!!this.required) {
                attributes.required = 'required';
            }
            
            if (!!this.autofocus) {
                attributes.autofocus = 'autofocus';
            }

            if (this.inputContainer) {
                this.clearChildren(this.inputContainer);
            }

            // create input field
            this.inputField = this.createDOMElement('input', attributes);

            // append the newly created input field
            this.inputContainer.append(this.inputField);

            // add toggle button
            this.createTogglerElement(type);

            // input field eventListener onkeyup
            if (this.inputField) {
                this.inputField.addEventListener('keyup', this.handleInputFieldChangeEvent, false);
            }
        }

        
        /**
         * Password and text type field toggler button
         * 
         * @param {string} type - field type text/password
         * @return {void}
         */
        createTogglerElement = (type) => {
            //create toggle button
            this.srOnlyToggler = this.createDOMElement('span', {class: 'sr-only'}, this.translate('JSHOW'));
            this.toggler = this.createDOMElement('span', {class: `input-group-text ${type == 'password' ? 'icon-eye-open' : 'icon-eye-close'} input-password-toggle`, 'aria-hidden': true});
            this.inputContainer.append(this.srOnlyToggler);
            this.inputContainer.append(this.toggler);

            // add toggle event listener
            this.toggler.addEventListener('click', this.handleToggleFieldType, false);
        }

        
        /**
         * Create strength-indicators
         * 
         * @return {void}
         */
        createStrengthIndicators = () => {
            if (this.strengthMeter) {
                this.indicators = [];
                for(let i = 1; i <= 5; i++) {
                    let indicator = this.createDOMElement('span', {class: 'strength-indicator'});
                    this.indicatorsContainer.append(indicator);
                    this.indicators.push(indicator);
                }
            }
        }

        
        /**
         * toggle input type i.e. password to text event handler
         * 
         *  @param {event} event - click event
         * 
         * @return {void}
         */
        handleToggleFieldType = (event) => {
            event.preventDefault();

            // toggle the isPasswordField
            this.isPasswordField = !this.isPasswordField;
            
            if (this.isPasswordField) {
                this.createPasswordField('password');
            } else {
                this.createPasswordField('text');
            }
        }

        /**
         * manage indicator classes 
         * this will add very-weak, weak, good, great, strong modifier
         * according to score value
         * 
         * @param {integer} level - password strength level
         * 
         * @return {void}
         */
        manageIndicatorClasses(level) {
            const modifierClasses = ['very-weak', 'weak', 'good', 'great', 'strong'];

            // reset all the indicator modifier classes
            for (let i = 0 ; i < 5; i ++) {
                for (let j = 0, l = modifierClasses.length; j < l; j++) {
                    if (this.indicators[i].classList.contains(modifierClasses[j])) {
                        this.indicators[i].classList.remove(modifierClasses[j]);
                    }
                }
            }

            // set updated modifier classes for the indicators
            for (let i = 0; i < level; i++) {
                this.indicators[i].classList.add(modifierClasses[level-1]);
            }
        }


        /**
         * Update indicators according to score change
         * 
         * @param {integer} score - strength score value
         * @return {void}
         */
        updateIndicators = (score) => {
            // if score less than 41 then very weak password
            if (score < 41) {
                this.manageIndicatorClasses(1);
                this.indicatorText.innerHTML = this.translate('JFIELD_PASSWORD_INDICATOR_VERY_WEAK');
            }

            // if score less than 51 but greater than 40 then not very-weak but weak password
            if (score > 40 && score < 51) {
                this.manageIndicatorClasses(2);
                this.indicatorText.innerHTML = this.translate('JFIELD_PASSWORD_INDICATOR_WEAK');
            }

            // if score less than 65 but greater than 50 then not-good yet password
            if (score > 50 && score < 65) {
                this.manageIndicatorClasses(3);
                this.indicatorText.innerHTML = this.translate('JFIELD_PASSWORD_INDICATOR_GOOD');
            }

            // if score is less than 80 but greater than 64 then good password
            if (score > 64 && score < 80) {
                this.manageIndicatorClasses(4);
                this.indicatorText.innerHTML = this.translate('JFIELD_PASSWORD_INDICATOR_GREAT');
            }

            // if score greater than 79 then strong password
            if (score > 79) {
                this.manageIndicatorClasses(5);
                this.indicatorText.innerHTML = this.translate('JFIELD_PASSWORD_INDICATOR_STRONG');
            }
        }


        /**
         * input field change event handler
         * @param {event} event - keyup event
         * 
         * @return {void}
         */
        handleInputFieldChangeEvent = (event) => {
            event.preventDefault();

            let {value} = event.target;
            this.inputValue = value;
            this.inputField.value = value;
            
            value = typeof value == 'string' && value.length > 0 ? value : false;
            
            // get the strength score for the input password
            if (this.strengthMeter) {
                let score = 0;
                if (value) {
                    score = this.getScore(value);
                    this.indicatorsContainer.classList.add('show');
                } else {
                    if (this.indicatorsContainer.classList.contains('show')) {
                        this.indicatorsContainer.classList.remove('show');
                    }
                }
                this.updateIndicators(score);
            }
        }
    }
    
    customElements.define('joomla-field-password', JoomlaFieldPassword);
})(Joomla);