mocha.setup('bdd');

var ready;

before(function (done) {
  ready = done;
});

var expect = chai.expect;

var keyAttribute = "k";
var indexAttribute = "v";
var timeout = 5000;
var n = 200;
var sampleItems = [];
var sampleItemsWithId = [];

window.addEventListener('WebComponentsReady', function(e) {
  document.head.innerHTML += '<link rel="import" id="el" href="/base/src/element.html">';
  document.querySelector('#el').addEventListener('load', function() {
    window.kv = document.createElement('x-storage-indexeddb');
    kv.setAttribute('name', 'x-store-no-key-1');
    kv.setAttribute('index', 'v i');
    window.kvk = document.createElement('x-storage-indexeddb');
    kvk.setAttribute('name', 'x-store-key-1');
    kvk.setAttribute('key', keyAttribute);
    kvk.setAttribute('index', 'v i');
    document.body.appendChild(kvk);
    document.body.appendChild(kv);
    ready();
  });
});

function randomString() {
  return Math.random().toString(36).substr(2);
}

function randomNumber() {
  return Math.round(Math.random()*1000000);
}

function randomContent() {
  return Math.random() < 0.5 ? randomString() : randomNumber();
}

function generateSampleItems(n) {
  var collection = {};
  var items = [];
  while(Object.keys(collection).length < n) {
    var key = randomContent();
    collection[key] = randomContent();
  }
  for (var itemKey in collection) {
    var item = {};
    item[keyAttribute] = itemKey;
    item.v = collection[itemKey];
    items.push(item);
  }
  items = shuffleArray(items);
  for (var i = 0; i < items.length; i++) {
    items[i].i = i;
  }
  return items;
}

function shuffleArray(o){
    for(var j, x, i = o.length; i; j = Math.floor(Math.random() * i), x = o[--i], o[i] = o[j], o[j] = x);
    return o;
}

function sortArray(array, property){
  var arr = array.slice(0);
  return arr.sort(function(a,b){
    var a1=typeof a[property], b1=typeof b[property];
    return a1<b1 ? -1 : a1>b1 ? 1 : a[property]<b[property] ? -1 : a[property]>b[property] ? 1 : 0;
  });
}

function populateDb(database){
  var array = sampleItems.slice(0);
  return database.clear()
    .then(function() {
      return array.reduce(function (prev, cur, i) {
        return prev.then(function() {
          return database.insert(cur);
        });
      }, Promise.resolve());
    })
    .then(function(){
      return Promise.resolve();
    });
}

function populateDbAndGetIds(database){
  var array = sampleItems.slice(0);
  var ids = [];
  return database.clear()
    .then(function() {
      return array.reduce(function (prev, cur, i) {
        return prev.then(function(id) {
          if (id) { ids.push(id); }
          return database.insert(cur);
        });
      }, Promise.resolve());
    })
    .then(function(lastId){
      ids.push(lastId);
      return Promise.resolve(ids);
    });
}

describe("the key value store with key", function(){
  this.timeout(timeout);

  before(function(done){
    sampleItems = generateSampleItems(n);
    singleItem = generateSampleItems(1)[0];
    populateDb(kvk)
      .then(function(){
        done();
      });
  });

  it("should return size() == " + n + "after saving 200 items with insert()", function(){
    var promise = kvk.size();
    return expect(
      promise
    ).to.eventually.equal(sampleItems.length);
  });

  it("should getMany() all items orderedBy the key attribute", function(){
    var arr = sortArray(sampleItems, keyAttribute);
    return expect(
      kvk.getMany()
    ).to.eventually.deep.equal(arr);
  });

  it("should getMany({'reverse': true}) all items ordered by the key attribute reversed", function(){
    var arr = sortArray(sampleItems, keyAttribute);
    arr.reverse();
    return expect(
      kvk.getMany({
        'reverse': true
      })
    ).to.eventually.deep.equal(arr);
  });

  it("should getMany({'orderby': indexAttribute}) all items ordered by an index attribute", function(){
    var arr = sortArray(sampleItems, indexAttribute);
    return expect(
      kvk.getMany({
        'orderby': indexAttribute
      })
    ).to.eventually.deep.equal(arr);
  });

  it("should getMany({'orderby': indexAttribute, 'reverse': true}) all items ordered by an index attribute reversed", function(){
    var arr = sortArray(sampleItems, indexAttribute).reverse();
    return expect(
      kvk.getMany({
        'orderby': indexAttribute,
        'reverse': true
      })
    ).to.eventually.deep.equal(arr);
  });

  it("should getMany({count: 5}) 5 items ordered by the key attribute", function(){
    var arr = sortArray(sampleItems, keyAttribute).slice(0,5);
    return expect(
      kvk.getMany({
        'count': 5
      })
    ).to.eventually.deep.equal(arr);
  });

  it("should getMany({count: 5, offset: 50}) 5 items ordered by the key attribute starting after item 50", function(){
    var arr = sortArray(sampleItems, keyAttribute).slice(50,50+5);
    return expect(
      kvk.getMany({
        'count': 5,
        'offset': 50
      })
    ).to.eventually.deep.equal(arr);
  });

  it("should getMany({count: 5, offset: 25, orderby: indexAttribute}) 5 items ordered by an index attribute starting after item 25", function(){
    var arr = sortArray(sampleItems, indexAttribute).slice(25,25+5);
    return expect(
      kvk.getMany({
        'count': 5,
        'offset': 25,
        'orderby': indexAttribute
      })
    ).to.eventually.deep.equal(arr);
  });

  it("should getMany({count: 5, start: <key of item 50>, orderby keyAttribute}) 5 items ordered by the key attribute starting after item 50", function(){
    var arr = sortArray(sampleItems, keyAttribute).slice(50,50+5);
    return expect(
      kvk.getMany({
        'count': 5,
        'start': arr[0][keyAttribute],
        'orderby': keyAttribute
      })
    ).to.eventually.deep.equal(arr);
  });

  it("should getMany({start: <key of item 50>, end: <key of item 54>, 'orderby': keyAttribute}) 5 items ordered by key starting after item 50", function(){
    var arr = sortArray(sampleItems, keyAttribute).slice(50,54);
    return expect(
      kvk.getMany({
        'start': arr[0][keyAttribute],
        'end': arr[3][keyAttribute],
        'orderby': keyAttribute
      })
    ).to.eventually.deep.equal(arr);
  });

  it("should getMany({start: <indexAttribute of item 50>, end: <indexAttribute of item 54>, 'orderby': indexAttribute}) 5 items ordered by indexAttribute starting after item 50", function(){
    var arr = sortArray(sampleItems, indexAttribute).slice(50,54);
    return expect(
      kvk.getMany({
        'start': arr[0][indexAttribute],
        'end': arr[3][indexAttribute],
        'orderby': indexAttribute
      })
    ).to.eventually.deep.equal(arr);
  });

  it("should get consecutive items in chunks of 10 by using getMany with offset and count multiple times", function(){
    var arr = sortArray(sampleItems, keyAttribute).slice(0,30);
    var res = [];
    return expect(
      kvk.getMany({
        'offset': 0,
        'count': 10,
        'orderby': keyAttribute
      }).then(function(items){
        res.push.apply(res,items);
        return kvk.getMany({
          'offset': 10,
          'count': 10,
          'orderby': keyAttribute
        });
      }).then(function(items){
        res.push.apply(res,items);
        return kvk.getMany({
          'offset': 20,
          'count': 10,
          'orderby': keyAttribute
        });
      }).then(function(items){
        res.push.apply(res,items);
        return res;
      })
    ).to.eventually.deep.equal(arr);
  });

  // it("should return an error when using getMany with start and end but without orderby", function(){
  //   var arr = sortArray(sampleItems, keyAttribute).slice(50,54);
  //   return expect(
  //     kvk.getMany({
  //       'start': arr[0][keyAttribute],
  //       'end': arr[3][keyAttribute],
  //     })
  //   ).to.eventually.be.rejected;
  // });

  it("should set(key, obj) an item and get(key) it", function(){
    var newItem = generateSampleItems(1)[0];
    return expect(
      kvk.set(newItem)
        .then(function(k){
          expect(k).to.equal(newItem[keyAttribute]);
          return kvk.get(newItem[keyAttribute]);
        })
    ).to.eventually.deep.equal(newItem);
  });

  it("should set(key, obj) an item, update it with set(key, obj) and get(key) it", function(){
    var newItem = generateSampleItems(1)[0];
    var updatedItem = newItem;
    updatedItem[indexAttribute] = randomContent();
    return expect(
      kvk.set(newItem)
        .then(function(k){
          expect(k).to.equal(newItem[keyAttribute]);
          return kvk.get(newItem[keyAttribute]);
        })
        .then(function(item){
          expect(item).to.deep.equal(newItem);
          return kvk.set(updatedItem);
        })
        .then(function(k){
          expect(k).to.equal(newItem[keyAttribute]);
          return kvk.get(newItem[keyAttribute]);
        })
    ).to.eventually.deep.equal(updatedItem);
  });

  it("should throw a ConstraintError when you try to insert() an item with an already existing key", function(){
    var newItem = generateSampleItems(1)[0];
    return expect(
      kvk.insert(newItem)
        .then(function() {
          return kvk.insert(newItem);
        })
    ).to.be.rejected;
  });

  it("should be empty again after clear()", function(){
    return expect(
      kvk.clear()
        .then(function(){ return kvk.size(); })
    ).to.eventually.equal(0);
  });
});

describe("the key value store without key", function(){
  this.timeout(timeout);

  before(function(done){
    sampleItems = generateSampleItems(n);
    singleItem = generateSampleItems(1)[0];
    populateDbAndGetIds(kv)
      .then(function(ids){
        for (var i = 0; i < ids.length; i++) {
          sampleItems[i].id=ids[i];
        }
        done();
      });
  });

  it("should getMany() all items in no particular order", function(){
    var arr = sortArray(sampleItems, keyAttribute);
    return expect(
      kv.getMany()
        .then(function(all){
          return sortArray(all, keyAttribute);
        })
    ).to.eventually.deep.equal(arr);
  });

  it("should getMany({start: <indexAttribute of item 50>, end: <indexAttribute of item 54>, 'orderby': indexAttribute}) 5 items ordered by an indexAttribute starting after item 50", function(){
    var arr = sortArray(sampleItems, indexAttribute).slice(50,54);
    return expect(
      kv.getMany({
        'start': arr[0][indexAttribute],
        'end': arr[3][indexAttribute],
        'orderby': indexAttribute
      })
    ).to.eventually.deep.equal(arr);
  });

  it("should getMany({count: 5, offset: 25, orderby: indexAttribute}) 5 items ordered by an index attribute starting after item 25", function(){
    var arr = sortArray(sampleItems, indexAttribute).slice(25,25+5);
    return expect(
      kv.getMany({
        'count': 5,
        'offset': 25,
        'orderby': indexAttribute
      })
    ).to.eventually.deep.equal(arr);
  });

  it("should getMany({count: 5, start: <key of item 50>, orderby keyAttribute}) 5 items ordered by an index attribute starting after item 50", function(){
    var arr = sortArray(sampleItems,indexAttribute).slice(50,50+5);
    return expect(
      kv.getMany({
        'count': 5,
        'start': arr[0][indexAttribute],
        'orderby': indexAttribute
      })
    ).to.eventually.deep.equal(arr);
  });

  it("should save(obj) an item, update it with set(key, obj) and get(key) it", function(){
    var newItem = generateSampleItems(1)[0];
    var updatedItem = newItem;
    updatedItem[indexAttribute] = randomContent();
    return expect(
      kv.insert(newItem)
        .then(function(id){
          updatedItem.id = id;
          return kv.get(id);
        })
        .then(function(item){
          expect(item).to.deep.equal(newItem);
          return kv.set(updatedItem);
        })
        .then(function(id){
          return kv.get(id);
        })
    ).to.eventually.deep.equal(updatedItem);
  });
});
