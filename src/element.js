(function () {

  var KEYVALUE_API_VERSION = 1;

  var indexedDB = window.indexedDB ||
                  window.mozIndexedDB ||
                  window.webkitIndexedDB ||
                  window.msIndexedDB;
                  
  var IDBTransaction = window.IDBTransaction ||
                       window.webkitIDBTransaction ||
                       window.mozIDBTransaction ||
                       window.msIDBTransaction;

  var IDBKeyRange = window.IDBKeyRange ||
                    window.webkitIDBKeyRange ||
                    window.msIDBKeyRange;

  function wrap(req) {
    return new Promise(function (resolve, reject) {
      req.onsuccess = function (e) {
        resolve(req.result);
      };
      req.onerror = function (e) {
        reject(req.errorCode);
      };
    });
  }


  function IndexedDbStore(storeName, indices) {

    var self = this;
    self._ready = false;
    self.storeName = storeName;
    self.indices = indices;
    
    self.ready = new Promise(function (resolve, reject) {
      if (!indexedDB) {
        reject('No indexedDB implementation found!');
      }
      var req = indexedDB.open(self.storeName, KEYVALUE_API_VERSION);
      req.onsuccess = function (e) {
        self.db = req.result;
        resolve(self);
      };
      req.onupgradeneeded = function (e) {
        self.db = req.result;
        var store = self.db.createObjectStore(self.storeName, {autoIncrement: true});
        resolve(self);
      };
      req.onerror = reject;
    });

    self.ready.then(function() {
      self._ready = true;
    });

  }

  IndexedDbStore.prototype = {

    // Internal function: returns the objectStore with the supplied 
    // transaction mode. Defaults to readonly transaction.
    _getObjectStore: function(mode) {
      var self = this;
      mode = typeof mode !== 'undefined' ? mode : 'readonly';
      var t = self.db.transaction(self.storeName, mode);
      return t.objectStore(self.storeName);
    }, 

    // Internal function to defer the execution of a supplied function
    // until the database is ready.
    _awaitReady: function(fn, args) {
      var self = this;
      if (self._ready) {
        return fn.apply(self, args);
      } else {
        return self.ready.then(function() {
          return fn.apply(self, args);
        });
      }
    },

    save: function (object) {
      var self = this;
      return self._awaitReady(self._save, arguments);
    },
    _save: function (object) {
      var self = this;
      var store = self._getObjectStore('readwrite');
      return wrap(store.put(object));  
    },


    /**
     * Update or insert an Object at the given id.
     * @param {number} id
     * @param {string|number|object} object
     * @return {promise} for the id of the created object
     */
    set: function (id, object) {
      var self = this;
      return self._awaitReady(self._set, arguments);
    },
    _set: function (id, object) {
      var self = this;
      var store = self._getObjectStore('readwrite');
      return wrap(store.put(object, id));       
    },


    /**
     * Get the object saved at a given id.
     * @param  {number} id
     * @return {promise} for the object
     */
    get: function (id) {
      var self = this;
      return self._awaitReady(self._get, arguments);
    },
    _get: function (id) {
      var self = this;
      var store = self._getObjectStore();
      return wrap(store.get(id));
    },


    /**
     * Removes the the entry with the supplied id from the database.
     * @param  {number} id
     * @return {promise} for undefined
     */
    remove: function (id) {
      var self = this;
      return self._awaitReady(self._remove, arguments);
    },
    _remove: function (id) {
      var self = this;
      var store = self._getObjectStore('readwrite');
      return wrap(store.delete(id));
    },

    /**
     * Returns all databse entries.
     * @param  {string}  [orderBy='key'] The index to order the results by.
     *                                   Can be 'key', 'value' or 'insertionTime'.
     * @param  {boolean} [reverse=false] Reverse the order of the results.
     * @return {promise}
     */
    getAll: function(options) {
      var self = this;
      return self._awaitReady(self._getMany, arguments);
    },

    _getAll: function(options) {
      var self = this;
      return new Promise(function (resolve,reject) {
        // Get all entries by calling _getRange
        resolve(self._getMany(options));
      });
    },

    /**
     * Returns multiple database entries.
     * @param  {options} 
     *   {any}    start            The first id of the results.
     *   {any}    end              The last id of the results.
     *   {number} count            The number of results
     *   {number} offset           The offset of the first result
     *   use [start] with ([end] or/and [count])
     *   use [offset] with ([end] or/and [count])
     *   using [end] together with [count] the results stop at whatever comes first.
     * @return {promise} for the objects
     */
    getMany: function(options) {
      var self = this;
      return self._awaitReady(self._getMany, arguments);
    },
    _getMany: function(options) {
      options = options || {};
      var self = this;
      var store = self._getObjectStore();
      var counter = 0;
      var index = 0;
      var start = options.start;
      var end = options.end;
      var count = options.count || undefined;
      var offset = options.offset || undefined;
      // set bound based on options
      var bound;
      if (start && end) {
        bound = IDBKeyRange.bound(start,end);
      } else if (start) {
        bound = IDBKeyRange.lowerBound(start);
      } else if (end) {
        bound = IDBKeyRange.upperBound(end);
      } else {
        bound = null;
      }
      var allItems = [];
      return new Promise(function(resolve,reject){
        //open cursor with the bound
        var cursorRequest = store.openCursor(bound);
        cursorRequest.onsuccess = function(e){
          var cursor = e.target.result;
          // if we reached the end of the items or as many items as
          // requested with the counter, resolve with the result array.
          if (cursor === null ||
              cursor === undefined ||
              (counter !== undefined && counter >= count)) {
            resolve(allItems);
          } else {
            // if we ware above the offset or no offset is specified,
            // add the item to teh results
            if (!offset || index >= offset) {
              allItems.push(cursor.value);
              counter++;
            }
            index++;
            cursor.continue();
          }
        };
      });
    },

    /**
     * Returns the number of database entries.
     * @return {promise} for the size 
     */
    size: function() {
      var self = this;
      return self._awaitReady(self._size);
    },

    _size: function() {
      var self = this;
      var store = self._getObjectStore();
      return wrap(store.count());
    },

    /**
     * Deletes all database entries.
     * @return {promise}
     */
    clear: function () {
      var self = this;
      return self._awaitReady(self._clear);
    },

    _clear: function() {
      var self = this;
      var store = self._getObjectStore('readwrite');
      return wrap(store.clear());
    }
        
  };


var StoragePrototype = Object.create(HTMLElement.prototype);

  StoragePrototype.createdCallback = function () {
    this.name = this.getAttribute('name') || 'storage';
    this.indices = this.getAttribute('index').split(" ");
    this.storage = new IndexedDbStore(this.name, this.indices);
  };
  StoragePrototype.attachedCallback = function () {
  };
  StoragePrototype.detatchedCallback = function () {
  };
  StoragePrototype.attributeChangedCallback = function (attr, oldVal, newVal) {
  };

  StoragePrototype.save = function (object) {
    return this.storage.save(object);
  };
  StoragePrototype.set = function (id, object) {
    return this.storage.set(id, object);
  };
  StoragePrototype.update = function (id, object) {
    return this.storage.set(id, object);
  };
  StoragePrototype.get = function (id) {
    return this.storage.get(id);
  };
  StoragePrototype.remove = function (id) {
    return this.storage.remove(id);
  };
  StoragePrototype.getAll = function (options) {
    return this.storage.getAll(options);
  };
  StoragePrototype.getMany = function (options) {
    return this.storage.getMany(options);
  };
  StoragePrototype.size = function () {
    return this.storage.size();
  };
  StoragePrototype.clear = function () {
    return this.storage.clear();
  };

  document.registerElement('x-storage-indexeddb', {
    prototype: StoragePrototype
  });

})();