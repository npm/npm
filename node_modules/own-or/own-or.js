module.exports = function ownOr (object, field, fallback) {
  if (Object.prototype.hasOwnProperty.call(object, field))
    return object[field]
  else
    return fallback
}
