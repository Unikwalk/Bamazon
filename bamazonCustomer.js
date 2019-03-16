var mysql = require("mysql");
var inquirer = require("inquirer");

var connection = mysql.createConnection({
  host: "localhost",
  port: 3306,
  user: "root",
  password: "miumiuisawesomE",
  database: "bamazon_db"
});

connection.connect(function (err) {
  if (err) {
    console.error("error connecting: " + err.stack);
  }
  displayProducts();
});

//Display all products

function displayProducts() {
  connection.query("SELECT * FROM products", function (err, res) {
    if (err) throw err;
    console.table(res);

    runSearch(res);
  });
}

function runSearch(stock) {
  inquirer
    .prompt({
      name: "choice",
      type: "input",
      message: "What's the ID of the item you would you like to purchase: [Exit with 'X']",
      //Check if the input is not a number or an "x"
      validate: function (val) {//val is the answer to the question above
        return !isNaN(val) || val.toLowerCase() === "x";
      }
    })
    .then(function (val) {
      //If input is "x"
      exitFunction(val.choice);
      var choiceId = parseInt(val.choice); //change the answer from a string to a number
      var product = checkStock(choiceId, stock);

      // If the item is in stock, ask for quantity
      if (product) {
        askForQuantity(product);
      }
      else {
        // Otherwise let them know the item is not in the stock, re-run displayProducts
        console.log("\nThat item is not in the stock.");
        displayProducts();
      }
    });
};

function askForQuantity(product) {
  inquirer
    .prompt([
      {
        name: "quantity",
        type: "input",
        message: "How many do you need? [Exit with 'X']",
        validate: function (val) { //check if the answer to question above is more than 0 or an "x"
          return val > 0 || val.toLowerCase() === "x";
        }
      }
    ])
    .then(function (val) {
      //If input is "x"
      exitFunction(val.quantity);
      var quantity = parseInt(val.quantity); //change the answer from a string to a number

      //if not enough stock, tell customer and displayProducts again
      if (quantity > product.stock_quantity) {
        console.log("\nNot Enough Stock!");
        displayProducts();
      }
      else {
        // Otherwise run makePurchase, give it the product information and desired quantity to purchase
        makePurchase(product, quantity);
      }
    });
}

function makePurchase(product, quantity) {
  connection.query(
    "UPDATE products SET stock_quantity = stock_quantity - ? WHERE item_id = ?", //update mysql database, subtract the input quantity
    [quantity, product.item_id],
    function (err, res) {
      // Let the user know the purchase was successful, re-run loadProducts
      console.log("\nSuccessfully purchased " + quantity + " " + product.product_name + "(s)!" +
        "\n" +
        "\n-----------------------------"
      );
      displayProducts();
    }
  );
}

function checkStock(choiceId, stock) {
  for (var i = 0; i < stock.length; i++) {
    if (stock[i].item_id === choiceId) {
      // If a matching product is found, return the product
      return stock[i];
    }
  }
  // Otherwise return null
  return null;
}

function exitFunction(choice) {
  if (choice.toLowerCase() === "x") {
    console.log("Goodbye!");
    process.exit(0);
  }
}