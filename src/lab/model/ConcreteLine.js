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

goog.provide('myphysicslab.lab.model.ConcreteLine');

goog.require('myphysicslab.lab.model.AbstractSimObject');
goog.require('myphysicslab.lab.util.DoubleRect');
goog.require('myphysicslab.lab.util.Vector');
goog.require('myphysicslab.lab.util.Util');
goog.require('myphysicslab.lab.model.Line');

goog.scope(function() {

var AbstractSimObject = myphysicslab.lab.model.AbstractSimObject;
var DoubleRect = myphysicslab.lab.util.DoubleRect;
var Vector = myphysicslab.lab.util.Vector;
var NF = myphysicslab.lab.util.Util.NF;
var Util = myphysicslab.lab.util.Util;

/** A {@link myphysicslab.lab.model.Line} whose endpoints can be modified.

* @param {string} name the name of this ConcreteLine, for scripting
* @param {!Vector=} startPt  starting point, default is the origin
* @param {!Vector=} endPt  ending point, default is the origin
* @constructor
* @final
* @struct
* @extends {AbstractSimObject}
* @implements {myphysicslab.lab.model.Line}
*/
myphysicslab.lab.model.ConcreteLine = function(name, startPt, endPt) {
  AbstractSimObject.call(this, name);
  /**
  * @type {!Vector}
  * @private
  */
  this.startPt_ = goog.isObject(startPt) ? startPt : Vector.ORIGIN;
  /**
  * @type {!Vector}
  * @private
  */
  this.endPt_ = goog.isObject(endPt) ? endPt : Vector.ORIGIN;
};
var ConcreteLine = myphysicslab.lab.model.ConcreteLine;
goog.inherits(ConcreteLine, AbstractSimObject);

if (!Util.ADVANCED) {
  /** @inheritDoc */
  ConcreteLine.prototype.toString = function() {
    return ConcreteLine.superClass_.toString.call(this).slice(0, -1)
        +', startPoint: '+this.getStartPoint()
        +', endPoint: '+this.getEndPoint()
        +'}';
  };
};

/** @inheritDoc */
ConcreteLine.prototype.getClassName = function() {
  return 'ConcreteLine';
};

/** @inheritDoc */
ConcreteLine.prototype.getBoundsWorld = function() {
  return DoubleRect.make(this.getStartPoint(), this.getEndPoint());
};

/** @inheritDoc */
ConcreteLine.prototype.getEndPoint = function() {
  return this.endPt_;
};

/** @inheritDoc */
ConcreteLine.prototype.getStartPoint = function() {
  return this.startPt_;
};

/** @inheritDoc */
ConcreteLine.prototype.getVector = function() {
  return this.getEndPoint().subtract(this.getStartPoint());
};

/** Sets ending point of the line.
@param {!Vector} loc the ending point in world coords.
*/
ConcreteLine.prototype.setEndPoint = function(loc) {
  this.endPt_ = loc;
};

/** Sets starting point of the line.
@param {!Vector} loc the starting point in world coords.
*/
ConcreteLine.prototype.setStartPoint = function(loc) {
  this.startPt_ = loc;
};

/** @inheritDoc */
ConcreteLine.prototype.similar = function(obj, opt_tolerance) {
  if (!(obj instanceof this.constructor)) {
    return false;
  }
  var ml = /** @type {!ConcreteLine}*/(obj);
  if (!ml.getStartPoint().nearEqual(this.getStartPoint(), opt_tolerance)) {
    return false;
  }
  return ml.getEndPoint().nearEqual(this.getEndPoint(), opt_tolerance);
};

}); // goog.scope
