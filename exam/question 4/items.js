/*
  Copyright (c) 2008 - 2016 MongoDB, Inc. <http://mongodb.com>

  Licensed under the Apache License, Version 2.0 (the "License");
  you may not use this file except in compliance with the License.
  You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

  Unless required by applicable law or agreed to in writing, software
  distributed under the License is distributed on an "AS IS" BASIS,
  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
  See the License for the specific language governing permissions and
  limitations under the License.
*/


var MongoClient = require('mongodb').MongoClient,
    assert = require('assert');


function ItemDAO(database) {
    "use strict";

    const ITEM_COLLECTION_NAME = 'item';

    this.db = database;

    this.getCategories = function(callback) {
        "use strict";

       var categories = [];

       this.db.collection(ITEM_COLLECTION_NAME)
               .aggregate( [
                    { $count: "num" }
               ] ).next(function(err, doc) {
                   if (err) {
                       return;
                   } else {
                        var category = {
                            _id: "All",
                            num: doc.num
                        };

                        categories.push(category);
                    }
               } );

       this.db.collection(ITEM_COLLECTION_NAME)
              .aggregate( [
                  { $group: {
                      _id: "$category",
                      products: { $addToSet: "$_id" }
                  } },
                  { $project: {
                      num: { $size: "$products" }
                  } },
                  { $sort: {
                      _id: 1
                  } }
              ] )
              .toArray(function(err, docs) {
                  if (err) {
                      callback(categories);
                  } else {
                      var i;
                      for (i = 0; i < docs.length; i++) {
                          categories.push(docs[i]);
                      }

                      callback(categories);
                  }
              });
    }


    this.getItems = function(category, page, itemsPerPage, callback) {
        "use strict";

        var pageItems = [];
        var query = createCategoryQuery(category);

        var itemsToSkip = calculateItemsToSkip(page, itemsPerPage);

        var cursor = this.db.collection(ITEM_COLLECTION_NAME)
                            .find(query)
                            .sort({_id: 1})
                            .limit(itemsPerPage)
                            .skip(itemsToSkip);
        
        cursor.forEach(
            function(doc) {
                if (pageItems.length < 5) {
                    pageItems.push(doc);
                }
            },
            function(err) {
                callback(pageItems);
            }
        );
    }

    this.getNumItems = function(category, callback) {
        "use strict";

        var query = createCategoryQuery(category);

        this.db.collection(ITEM_COLLECTION_NAME)
               .find(query)
               .count(function(err, count) {
                  callback(count);
               });
    }

    this.searchItems = function(query, page, itemsPerPage, callback) {
        "use strict";

        var textQuery = createTextSearchQuery(query);

        var itemsToSkip = calculateItemsToSkip(page, itemsPerPage);

        var items = [];

        this.db.collection(ITEM_COLLECTION_NAME)
               .find(textQuery)
               .sort({ _id: 1})
               .skip(itemsToSkip)
               .limit(itemsPerPage)
               .forEach(
                    function(doc) {
                        items.push(doc);
                    },
                    function(err) {
                        callback(items);
               });
    }


    this.getNumSearchItems = function(query, callback) {
        "use strict";

        var textQuery = createTextSearchQuery(query);

        this.db.collection(ITEM_COLLECTION_NAME)
               .find(textQuery)
               .sort({ _id: 1})
               .count(function(err, count) {
                    callback(count);
               });
    }


    this.getItem = function(itemId, callback) {
        "use strict";

        var query = {
            _id: itemId
        };

        this.db.collection(ITEM_COLLECTION_NAME)
               .find(query)
               .next(function(err, doc) {
                   callback(doc);
               });
    }


    this.getRelatedItems = function(callback) {
        "use strict";

        this.db.collection(ITEM_COLLECTION_NAME).find({})
            .limit(4)
            .toArray(function(err, relatedItems) {
                assert.equal(null, err);
                callback(relatedItems);
            });
    };


    this.addReview = function(itemId, comment, name, stars, callback) {
        "use strict";

        /*
         * TODO-lab4
         *
         * LAB #4: Implement addReview().
         *
         * Using the itemId parameter, update the appropriate document in the
         * "item" collection with a new review. Reviews are stored as an
         * array value for the key "reviews". Each review has the fields:
         * "name", "comment", "stars", and "date".
         *
         */

        var reviewDoc = {
            name: name,
            comment: comment,
            stars: stars,
            date: Date.now()
        }

        // TODO replace the following two lines with your code that will
        // update the document with a new review.
        var doc = this.createDummyItem();
        doc.reviews = [reviewDoc];

        // TODO Include the following line in the appropriate
        // place within your code to pass the updated doc to the
        // callback.
        callback(doc);
    }


    this.createDummyItem = function() {
        "use strict";

        var item = {
            _id: 1,
            title: "Gray Hooded Sweatshirt",
            description: "The top hooded sweatshirt we offer",
            slogan: "Made of 100% cotton",
            stars: 0,
            category: "Apparel",
            img_url: "/img/products/hoodie.jpg",
            price: 29.99,
            reviews: []
        };

        return item;
    }

    function calculateItemsToSkip(page, itemsPerPage) {
        return page * itemsPerPage;
    }

    function createTextSearchQuery(query) {
        var textQuery = {};
        if (textQuery !== null) {
            textQuery = {
                "$text": {
                    $search: query
                }
            };
        }
        return textQuery;
    }

    function createCategoryQuery(category) {
        var query = {};
        if (category !== 'All') {
            query = {
                "category": category
            };
        }
        return query;
    }
}


module.exports.ItemDAO = ItemDAO;
