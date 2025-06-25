const isArray = (a) => !!a && a.constructor === Array;

const isEmptyArray = (a) => !a || !Array.isArray(a) || a.length === 0;

const arrayLength = (a) => (isArray(a) ? a.length : 0);

const isNull = (a) => a === null;

const isBoolean = (a) => typeof a === "boolean";

const isBoolTrue = (a) => typeof a === "boolean" && a === true;

const isEmptyString = (a) => a === "";

const isObject = (a) => !!a && a.constructor === Object;

const isEmptyObject = (a) => Object.keys(a).length === 0;

module.exports = {
  isArray,
  isEmptyArray,
  arrayLength,
  isNull,
  isBoolean,
  isBoolTrue,
  isEmptyString,
  isObject,
  isEmptyObject,
};
