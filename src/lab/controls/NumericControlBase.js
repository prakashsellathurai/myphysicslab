// Copyright 2016 Erik Neumann.  All Rights Reserved.
//
// Licensed under the Apache License, Version 2.0 (the 'License');
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an 'AS IS' BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

goog.provide('myphysicslab.lab.controls.NumericControlBase');

goog.require('goog.array');
goog.require('goog.dom');
goog.require('goog.events');
goog.require('goog.events.Event');
goog.require('myphysicslab.lab.util.Util');
goog.require('myphysicslab.lab.util.Observer');
goog.require('myphysicslab.lab.controls.LabControl');

goog.scope(function() {

var Observer = myphysicslab.lab.util.Observer;
var Util = myphysicslab.lab.util.Util;
var NF = myphysicslab.lab.util.Util.NF;

/** A text input element for displaying and editing the numeric value of a target
object.

Because this is an {@link Observer}, you can connect it to a Subject; when the Subject
broadcasts events, the {@link #observe} method ensures that this control reflects the
current target value.

### Number Formatting

The number is formatted without any thousands separators and with the number of
fractional decimal places depending on the "mode".

+ **Fixed decimal places mode** shows the number of decimal places given by
{@link #getDecimalPlaces}.
Ignores significant digits setting. *Fixed decimal places mode* is active when
`getDecimalPlaces()` returns 0 or greater.

+ **Variable decimal places mode** ensures that the requested number of significant
digits are visible. Adjusts decimal places shown based on the magnitude of the value.
See {@link #setSignifDigits}. *Variable decimal places mode* is active when
`getDecimalPlaces()` returns –1.

The default setting is *variable decimal places mode* with 3 significant digits.

The displayed value is rounded to a certain number of digits, and therefore the
displayed value can differ from the target value. NumericControlBase allows for
this difference by only making changes to the target value when the the user
modifies the displayed value, or when {@link #setValue} is called.

### Preventing Forbidden Values

To prevent the user from entering forbidden values (such as enforcing upper or lower
limits) the setter function can throw an Error. An alert is displayed to the user with
the text of the Error. After dismissing the alert, the displayed value will be restored
to match the current target value, as returned by the `getter`. (Note that the user's
input is discarded).

### To Do List

There is a problem with the current variable mode which is when you have a
very tiny number, say 1.234567e-12, then it will format it like: 0.000000000001234567
when setting the significant digits to 7 and decimals to be variable. This is usually
far bigger than we want. It should instead either switch to exponential, or have a
maximum limit on the number of decimals shown.  Or a limit on total number of digits
shown, switching to exponential when needed.


* @param {string} label the text shown in a label next to the number input field
* @param {function():number} getter function that returns the current target value
* @param {function(number)} setter function to change the target value
* @param {!HTMLInputElement=} textField  the text field to use; if not provided, then
*     a text field is created.
* @constructor
* @struct
* @implements {myphysicslab.lab.controls.LabControl}
* @implements {Observer}
*/
myphysicslab.lab.controls.NumericControlBase = function(label, getter, setter, textField) {
  /** the name shown in a label next to the textField
  * @type {string}
  * @private
  */
  this.label_ = label;
  /** function that returns the current target value
  * @type {function():number}
  * @private
  */
  this.getter_ = getter;
  /** function to change the target value
  * @type {function(number)}
  * @private
  */
  this.setter_ = setter;
  /** The exact value of the target as last seen by this control;
   note that the displayed value may be different due to rounding.
  * @type {number}
  * @private
  */
  this.value_ = getter();
  if (!goog.isNumber(this.value_)) {
    throw new Error('not a number '+this.value_);
  }
  /** The number of significant digits to display.
  * @type {number}
  * @private
  */
  this.signifDigits_ = 3;
  /** Fixed number of fractional decimal places to show, or –1 if variable.
  * @type {number}
  * @private
  */
  this.decimalPlaces_ = -1;
  /** The number of columns (characters) shown in the text field.
  * @type {number}
  * @private
  */
  this.columns_ = Math.max(8, 1+this.signifDigits_);
  /** @type {HTMLLabelElement} */
  var labelElement = null;
  if (goog.isObject(textField)) {
    // see if the parent is a label
    var parent = goog.dom.getParentElement(textField);
    if (parent != null && parent.tagName == 'LABEL') {
      labelElement = /** @type {!HTMLLabelElement} */(parent);
    }
  } else {
    // create input text field and label
    textField = /** @type {!HTMLInputElement} */(document.createElement('input'));
    textField.type = 'text';
    textField.size = this.columns_;
    labelElement = /** @type {!HTMLLabelElement} */(document.createElement('LABEL'));
    labelElement.appendChild(document.createTextNode(this.label_));
    labelElement.appendChild(textField);
  }
  /** the text field showing the double value
  * @type {!HTMLInputElement}
  * @private
  */
  this.textField_ = textField;
  /**
  * @type {!Element}
  * @private
  */
  this.topElement_ = labelElement !== null ? labelElement : this.textField_;
  /** The last value that the text field was set to, used to detect when user has
  intentionally changed the value;  note that the target value will be different
  than this because of rounding.
  * @type {string}
  * @private
  */
  this.lastValue_ = '';
  this.textField_.textAlign = 'right';
  /**  key used for removing the listener
  * @type {goog.events.Key}
  * @private
  */
  this.changeKey_ = goog.events.listen(this.textField_, goog.events.EventType.CHANGE,
      /*callback=*/this.validate, /*capture=*/true, this);
  /**  key used for removing the listener
  * @type {goog.events.Key}
  * @private
  */
  this.focusKey_ = goog.events.listen(this.textField_, goog.events.EventType.FOCUS,
      /*callback=*/this.gainFocus, /*capture=*/false, this);
  /**  key used for removing the listener
  * @type {goog.events.Key}
  * @private
  */
  this.clickKey_ = goog.events.listen(this.textField_, goog.events.EventType.CLICK,
      /*callback=*/this.doClick, /*capture=*/false, this);
  /**  True when first click in field after gaining focus.
  * @type {boolean}
  * @private
  */
  this.firstClick_ = false;
  this.formatTextField();
};
var NumericControlBase = myphysicslab.lab.controls.NumericControlBase;

// HISTORY: Oct 13 2014. The NumericControlBase input fields are too small
// under Safari browser, but OK under Chrome. I've bumped up the 'size' of
// the input fields by one, so it now looks OK under Safari, but is a
// little too wide in Chrome.

if (!Util.ADVANCED) {
  /** @inheritDoc */
  NumericControlBase.prototype.toString = function() {
    return this.toStringShort().slice(0, -1)
        +', signifDigits_: '+this.signifDigits_
        +', decimalPlaces_: '+this.decimalPlaces_
        +', columns_: '+this.columns_
        +'}';
  };

  /** @inheritDoc */
  NumericControlBase.prototype.toStringShort = function() {
    return this.getClassName() + '{label_: "'+this.label_+'"}';
  };
}

/** Returns the number of columns needed to show the number with the given number of
significant digits.
@param {number} x the number to display
@param {number} sigDigits the number of significant digits to show
@return {number} the number of columns needed
@private
*/
NumericControlBase.prototype.columnsNeeded = function(x, sigDigits) {
  var mag = NumericControlBase.magnitude(x);
  return 2 + this.decimalPlacesNeeded(x, sigDigits) + (mag > 0 ? mag : 0);
};

/** Returns the number of fractional decimal places needed to show the number
with the given number of significant digits.
@param {number} x the number to display
@param {number} sigDigits the number of significant digits to show
@return {number} the number of fractional decimal places needed
@private
*/
NumericControlBase.prototype.decimalPlacesNeeded = function(x, sigDigits) {
  if (this.decimalPlaces_ > -1) {
    return this.decimalPlaces_;
  } else {
    var d = sigDigits - 1 - NumericControlBase.magnitude(x);
    // limit of 16 decimal places; this could be a settable option.
    if (d > 16)
      d = 16;
    return d > 0 ? d : 0;
  }
};

/** @inheritDoc */
NumericControlBase.prototype.disconnect = function() {
  goog.events.unlistenByKey(this.changeKey_);
  goog.events.unlistenByKey(this.clickKey_);
  goog.events.unlistenByKey(this.focusKey_);
};

/**
* @param {!goog.events.Event} event the event that caused this callback to fire
* @private
*/
NumericControlBase.prototype.doClick = function(event) {
  if (this.firstClick_) {
    // first click after gaining focus should select entire field
    this.textField_.select();
    this.firstClick_ = false;
  }
};

/**  Sets the text field to match this.value_.
* @return {undefined}
* @private
*/
NumericControlBase.prototype.formatTextField = function() {
  var dec = this.decimalPlacesNeeded(this.value_, this.signifDigits_);
  var col = this.columnsNeeded(this.value_, this.signifDigits_);
  if (Util.DEBUG && 0 == 1) {
    console.log('columnsNeeded '+col+' dec='+dec+' x='
        +Util.NFE(this.value_)+' '+this.label_);
  }
  this.lastValue_ = this.value_.toFixed(dec);
  this.textField_.value = this.lastValue_;
  if (col != this.columns_) {
    this.columns_ = col;
    this.textField_.size =this.columns_;
  }
};

/**
* @param {!goog.events.Event} event the event that caused this callback to fire
* @private
*/
NumericControlBase.prototype.gainFocus = function(event) {
  this.firstClick_ = true;
};

/** Returns name of class of this object.
* @return {string} name of class of this object.
*/
NumericControlBase.prototype.getClassName = function() {
  return 'NumericControlBase';
};

/** Returns the fixed number of fractional decimal places to show when formatting
the number, or –1 when in *variable decimal places mode*.
@return {number} the fixed number of fractional decimal places to show when formatting
    the number, or –1 when in *variable decimal places mode*.
*/
NumericControlBase.prototype.getDecimalPlaces = function() {
  return this.decimalPlaces_;
};

/** @inheritDoc */
NumericControlBase.prototype.getElement = function() {
  return this.topElement_;
};

/** @inheritDoc */
NumericControlBase.prototype.getParameter = function() {
  return null;
};

/** Returns the number of significant digits to show when formatting the number. Only
has an effect in *variable decimal places mode*, see {@link #getDecimalPlaces}.
@return {number} the number of significant digits to show when formatting the number
*/
NumericControlBase.prototype.getSignifDigits = function() {
  return this.signifDigits_;
};

/** Returns the value of this control (which should match the target value if
{@link #observe} is being called). The displayed value may be different due to rounding.
@return {number} the value of this control
*/
NumericControlBase.prototype.getValue = function() {
  return this.value_;
};

/**
* @param {number} x
* @return {number}
* @private
*/
NumericControlBase.magnitude = function(x) {
  if (Math.abs(x) < 1E-15) {
    // fix for displaying zero.
    return 0;
  } else {
    return Math.floor(Math.LOG10E * Math.log(Math.abs(x)));
  }
};

/** @inheritDoc */
NumericControlBase.prototype.observe =  function(event) {
  // Ensures that the value displayed by the control matches the target value.
  this.setValue(this.getter_());
};

/** Sets the fixed number of fractional decimal places to show when formatting the
number, or a value of –1 puts this into *variable decimal places mode* where
the number of decimal places depends on the desired number of significant digits.
See {@link #setSignifDigits}.
@param {number} decimalPlaces the fixed number of fractional decimal places to show when
    formatting the number, or –1 to have variable number of fractional decimal places.
@return {!NumericControlBase} this object for chaining setters
*/
NumericControlBase.prototype.setDecimalPlaces = function(decimalPlaces) {
  if (this.decimalPlaces_ != decimalPlaces) {
    this.decimalPlaces_ = decimalPlaces > -1 ? decimalPlaces : -1;
    this.formatTextField();
  }
  return this;
};

/** @inheritDoc */
NumericControlBase.prototype.setEnabled = function(enabled) {
  this.textField_.disabled = !enabled;
};

/** Sets the number of significant digits to show when formatting the number. Only
has an effect in *variable decimal places mode*, see {@link #setDecimalPlaces}.
@param {number} signifDigits the number of significant digits to show when
    formatting the number
@return {!NumericControlBase} this object for chaining setters
*/
NumericControlBase.prototype.setSignifDigits = function(signifDigits) {
  if (this.signifDigits_ != signifDigits) {
    this.signifDigits_ = signifDigits;
    this.formatTextField();
  }
  return this;
};

/** Changes the value shown by this control, and sets the target to this value.
@param {number} value  the new value
*/
NumericControlBase.prototype.setValue = function(value) {
  if (value != this.value_) {
    if (Util.DEBUG && 0 == 1) {
      console.log('NumericControlBase.setValue value='+value+' vs '+this.value_);
    }
    try {
      if (isNaN(value)) {
        throw new Error('not a number '+value);
      }
      // set this.value_ first to prevent the observe() coming here twice
      this.value_ = value;
      // parameter_.setValue() broadcasts which causes observe() to be called here
      this.setter_(value);
    } catch(ex) {
      alert(ex);
      this.value_ = this.getter_();
    }
    this.formatTextField();
  }
};

/** Checks that an entered number is a valid number, updates the target value
* if valid; if an exception occurs then shows an alert and restores the old value.
* @param {!goog.events.Event} event the event that caused this callback to fire
* @private
*/
NumericControlBase.prototype.validate = function(event) {
  // trim whitespace from start and end of string
  var nowValue = this.textField_.value.replace(/^\s*|\s*$/g, '');
  // Compare the current and previous text value of the field.
  // Note that the double value may be different from the text value because
  // of rounding.
  if (nowValue != this.lastValue_) {
    var value = parseFloat(nowValue);
    if (isNaN(value)) {
      alert('not a number: '+nowValue);
      this.formatTextField();
    } else {
      this.setValue(value);
    }
  }
};

}); // goog.scope
