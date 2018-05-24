module.exports = Pool

function Pool () {
  this.length = 0
  this.head = null
  this.tail = null
}

Pool.prototype.add = function (data) {
  this.tail = new Item(data, this.tail, null)
  if (!this.head)
    this.head = this.tail
  this.length ++
}

Pool.prototype.remove = function (data) {
  if (this.length === 0)
    return

  var i = this.head.find(data)

  if (!i)
    return

  if (i === this.head)
    this.head = this.head.next

  if (i === this.tail)
    this.tail = this.tail.prev

  i.remove()
  this.length --
}

function Item (data, prev) {
  this.prev = prev
  if (prev)
    prev.next = this

  this.next = null
  this.data = data
}

Item.prototype.remove = function () {
  if (this.next)
    this.next.prev = this.prev
  if (this.prev)
    this.prev.next = this.next
  this.prev = this.next = this.data = null
}

Item.prototype.find = function (data) {
  return data === this.data ? this
  : this.next ? this.next.find(data)
  : null
}
