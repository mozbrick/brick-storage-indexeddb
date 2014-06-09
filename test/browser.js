mocha.setup('bdd');

var d = {};
var q = new Promise(function (resolve, reject) {
  d.resolve = resolve;
  d.reject = reject;
});

before(function (done) {
  q.then(done);
});

window.addEventListener('WebComponentsReady', function(e) {
  document.head.innerHTML += '<link rel="import" id="el" href="/base/src/element.html">';
  document.querySelector('#el').addEventListener('load', function() {
    window.kv = document.createElement('x-storage-indexeddb');
    kv.setAttribute('name', 'x-store-no-key-1');
    kv.setAttribute('index', 'v i');
    window.kvk = document.createElement('x-storage-indexeddb');
    kvk.setAttribute('name', 'x-store-key-1');
    kvk.setAttribute('key', 'k');
    kvk.setAttribute('index', 'v i');
    document.body.appendChild(kv);
    document.body.appendChild(kvk);
    // document.body.innerHTML += '<x-storage-indexeddb id="store-nk" name="x-store-no-key-1" index="v i"></x-storage-indexeddb>';
    // document.body.innerHTML += '<x-storage-indexeddb id="store-k" name="x-store-key-1" key="k" index="v i"></x-storage-indexeddb>';
    // window.kv = document.querySelector('#store-nk');
    // window.kvk = document.querySelector('#store-k');
    d.resolve();
  });
});



var expect = chai.expect;

var timeout = 5000;
var n = 200;
var k = 20;

var sampleItems = [];
var sampleIds = [];

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
    key = randomContent();
    collection[key] = randomContent();
  }
  for (var itemKey in collection) {
    var item = {};
    item.k = itemKey;
    item.v = collection[itemKey];
    items.push(item);
  }
  items = shuffleArray(items);
  for (var i = 0; i < items.length; i++) {
    items[i].i = i;
  };
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
  var ids = [];
  return database.clear()
    .then(function() {
      return array.reduce(function (prev, cur, i) {
        return prev.then(function(id) {
          if (id) { ids.push(id); }
          return database.save(cur);
        });
      }, Promise.resolve());
    })
    .then(function(lastId){
      ids.push(lastId)
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
      })
  })
  it("should return size() == " + n + "after saving 200 items with save()", function(){
    var promise = kvk.size();
    return expect(promise).to.eventually.equal(sampleItems.length);
  });
  it("should getAll() all items orderedBy key", function(){
    var arr = sortArray(sampleItems,"k");
    return expect(kvk.getAll()).to.eventually.deep.equal(arr);
  });
  it("should getAll({'reverse': true}) all items ordered by key reversed", function(){
    var arr = sortArray(sampleItems,"k");
    arr.reverse();
    return expect(kvk.getAll({'reverse': true})).to.eventually.deep.equal(arr);
  });
  it("should getAll({'orderby':'v'}) all items orderedBy v", function(){
    var arr = sortArray(sampleItems,"v");
    return expect(kvk.getAll({'orderby':'v'})).to.eventually.deep.equal(arr);
  });
  it("should getAll({'orderby':'v', 'reverse': true}) all items orderedBy v reversed", function(){
    var arr = sortArray(sampleItems,"v").reverse();
    return expect(kvk.getAll({'orderby':'v', 'reverse': true})).to.eventually.deep.equal(arr);
  });
  it("should getMany({count: 5}) 5 items ordered by key", function(){
    var arr = sortArray(sampleItems,"k").slice(0,5);
    return expect(kvk.getMany({'count':5})).to.eventually.deep.equal(arr);
  });
  it("should getMany({count: 5, offset: 50}) 5 items ordered by key order starting after item 50", function(){
    var arr = sortArray(sampleItems,"k").slice(50,50+5);
    return expect(kvk.getMany({'count':5, offset: 50})).to.eventually.deep.equal(arr);
  });
  it("should getMany({count: 5, offset: 25, orderby: v}) 5 items ordered by v order starting after item 25", function(){
    var arr = sortArray(sampleItems, "v").slice(25,25+5);
    return expect(kvk.getMany({'count':5, offset: 25, orderby: "v"})).to.eventually.deep.equal(arr);
  });
  it("should getMany({count: 5, start: <id of item 50>}) 5 items ordered by key starting after item 50", function(){
    var arr = sortArray(sampleItems,"k").slice(50,50+5);
    return expect(kvk.getMany({'count':5, 'start': arr[0].k})).to.eventually.deep.equal(arr);
  });
  it("should getMany({start: <id of item 50>, end: <id of item 54>}) 5 items ordered by key starting after item 50", function(){
    var arr = sortArray(sampleItems,"k").slice(50,54);
    return expect(kvk.getMany({start: arr[0].k, end: arr[3].k})).to.eventually.deep.equal(arr);
  });
  it("should set(key, obj) an item and get(key) it", function(){
    var newItem = generateSampleItems(1)[0];
    return expect(
      kvk.set(newItem.k, newItem)
        .then(function(k){
          expect(k).to.equal(newItem.k);
          return kvk.get(newItem.k);
        })
    ).to.eventually.deep.equal(newItem);
  });
  it("should set(key, obj) an item, update it with set(key, obj) and get(key) it", function(){
    var newItem = generateSampleItems(1)[0];
    var updatedItem = newItem;
    updatedItem.v = randomContent();
    return expect(
      kvk.set(newItem.k, newItem)
        .then(function(k){
          expect(k).to.equal(newItem.k);
          return kvk.get(newItem.k);
        })
        .then(function(item){
          expect(item).to.deep.equal(newItem);
          return kvk.set(newItem.k,updatedItem);
        })
        .then(function(k){
          expect(k).to.equal(newItem.k);
          return kvk.get(newItem.k);
        })
      ).to.eventually.deep.equal(updatedItem);
  });
  it("should throw a ConstraintError when you try to save() an existing item", function(){
    var newItem = generateSampleItems(1)[0];
    return expect(
      kvk.save(newItem)
        .then(function() {
          return kvk.save(newItem)
        })
    ).to.be.rejected;
  });
  it("should be empty again after clear()", function(){
    return expect(
      kvk.clear()
        .then(function(){ return kvk.size(); })
    ).to.eventually.equal(0);
  });
})

describe("the key value store without key", function(){
  this.timeout(timeout);

  before(function(done){
    populateDb(kv)
      .then(function(ids){
        sampleIds = ids;
        done();
      })
  })

  it("should return size() == " + n, function(done){
    kv.size()
      .then(function(s){expect(s).to.equal(sampleItems.length); done();})
  });
  it("should getAll() all items orderedBy id", function(done){
    var arr = sampleItems.slice(0);
    kv.getAll()
      .then(function(all){
        for (var i = 0; i < all.length; i++) {
          expect(all[i]).to.deep.equal(arr[i]);
        };
        done();
      });
  });
  it("should getAll({'reverse': true}) all items ordered by id reversed", function(done){
    var arr = sampleItems.slice(0);
    arr.reverse();
    kv.getAll({'reverse': true})
      .then(function(all){
        for (var i = 0; i < all.length; i++) {
          expect(all[i]).to.deep.equal(arr[i]);
        };
        done();
      })
  });
  it("should getMany({count: 5}) 5 items orderedBy id", function(done){
    var arr = sampleItems.slice(0);
    kv.getMany({'count':5})
      .then(function(all){
        expect(all.length).to.equal(5);
        for (var i = 0; i < all.length; i++) {
          expect(all[i]).to.deep.equal(arr[i]);
        }
        done();
      });
  });
  it("should getMany({count: 5, offset: 25}) 5 items ordered by id order starting after item 25", function(done){
    var arr = sampleItems.slice(0);
    kv.getMany({'count':5, offset: 25})
      .then(function(all){
        expect(all.length).to.equal(5);
        for (var i = 0; i < all.length; i++) {
          expect(all[i]).to.deep.equal(arr[i+25]);
        }
        done();
      });
  });
  it("should getMany({count: 5, offset: 25, orderby: v}) 5 items ordered by v order starting after item 25", function(done){
    var arr = sortArray(sampleItems, "v");
    kv.getMany({'count':5, offset: 25, orderby: "v"})
      .then(function(all){
        expect(all.length).to.equal(5);
        for (var i = 0; i < all.length; i++) {
          expect(all[i]).to.deep.equal(arr[i+25]);
        }
        done();
      });
  });
  it("should getMany({count: 5, start: <id of item 25>}) 5 items ordered by id starting after item 25", function(done){
    var arr = sampleItems.slice(0);
    kv.getMany({'count':5, start: sampleIds[25]})
      .then(function(all){
        expect(all.length).to.equal(5);
        for (var i = 0; i < all.length; i++) {
          expect(all[i]).to.deep.equal(arr[i+25]);
        }
        done();
      });
  });
  it("should getMany({start: <id of item 25>, end: <id of item 30>}) 5 items ordered by id starting after item 25", function(done){
    var arr = sampleItems.slice(0);
    kv.getMany({start: sampleIds[25], end: sampleIds[29]})
      .then(function(all){
        expect(all.length).to.equal(5);
        for (var i = 0; i < all.length; i++) {
          expect(all[i]).to.deep.equal(arr[i+25]);
        }
        done();
      });
  });
})
