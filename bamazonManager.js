var mysql = require("mysql");
var inquirer = require("inquirer");
require("console.table");

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
    displayMenu();
});

function displayMenu() {
    connection.query("SELECT * FROM products", function (err, res) {
        if (err) throw err;

        menuOptions(res);
    });
}

function menuOptions(products) {
    inquirer
        .prompt({
            name: "choice",
            type: "list",
            message: "Menu Options:",
            choices: [
                "View Products for Sale",
                "View Low Inventory",
                "Add to Inventory",
                "Add New Product",
                "Exit"
            ]
        })
        .then(function (val) {
            switch (val.choice) {
                case "View Products for Sale":
                    console.table(products);
                    displayMenu()
                    break;

                case "View Low Inventory":
                    viewLowInventory();
                    break;

                case "Add to Inventory":
                    promptAddInventory(products);
                    break;

                case "Add New Product":
                    promptAddProduct(products);
                    break;
                default:
                    console.log("Goodbye!");
                    process.exit(0);
                    break;
            }
        });
}


function viewLowInventory() {
    connection.query("SELECT * FROM products WHERE stock_quantity <= 5", function (err, res) {
        if (err) throw err;
        console.table(res); //put the data into a table
        displayMenu();
    });
}

function promptAddInventory(stock) {
    console.table(stock);
    inquirer
        .prompt([
            {
                name: "choice",
                type: "input",
                message: "What is the ID of the item you would you like add to?",
                validate: function (val) { //check if the answer to question above is more than 0 or an "x"
                    return !isNaN(val);
                }
            }
        ])
        .then(function (val) {
            var choiceId = parseInt(val.choice);
            var product = checkStock(choiceId, stock);

            if (product) {
                // Pass the chosen product to promptCustomerForQuantity
                askForQuantity(product);
            }
            else {
                // Otherwise let the user know and re-load the manager menu
                console.log("\nThat item is not in the stock.");
                displayMenu();
            }
        });
};

function askForQuantity(product) {
    inquirer
        .prompt([
            {
                name: "quantity",
                type: "input",
                message: "How many to add?",
                validate: function (val) { //check if the answer to question above is more than 0 or an "x"
                    return val > 0;
                }
            }
        ])
        .then(function (val) {
            var quantity = parseInt(val.quantity); //change the answer from a string to a number
            addQuantity(product, quantity);
        });
}

function addQuantity(product, quantity) {
    connection.query("UPDATE products SET stock_quantity = ? WHERE item_id = ?",
        [product.stock_quantity + quantity, product.item_id], function (err, res) {
            console.log("\nSuccessfully added " + quantity + " " + product.product_name + "(s)" +
                "\n" +
                "\n-----------------------------"
            );
            displayMenu();
        }
    );
}

function promptAddProduct(products) {
    inquirer
        .prompt([
            {
                type: "input",
                name: "product_name",
                message: "What is the name of the product?"
            },
            {
                type: "list",
                name: "department_name",
                choices: getDepartments(products),
                message: "Which department to assign for this product?"
            },
            {
                type: "input",
                name: "price",
                message: "What is the price?",
                validate: function (val) {
                    return val > 0;
                }
            },
            {
                type: "input",
                name: "quantity",
                message: "How many in stock?",
                validate: function (val) {
                    return !isNaN(val);
                }
            }
        ])
        .then(addNewProduct);
};

function addNewProduct(val) {
    connection.query("INSERT INTO products (product_name, department_name, price, stock_quantity) VALUES (?, ?, ?, ?)",
        [val.product_name, val.department_name, val.price, val.quantity], function (err, res) {
            if (err) throw err;
            console.log("\nSuccessfully added " + val.product_name + "!" +
                "\n" +
                "\n-----------------------------"
            );
            displayMenu();
        }
    );
}

function getDepartments(products) {
    var departments = [];
    for (var i = 0; i < products.length; i++) {
        if (departments.indexOf(products[i].department_name) === -1) {
            departments.push(products[i].department_name);
        }
    }
    return departments;
}


function checkStock(choiceId, stock) {
    for (var i = 0; i < stock.length; i++) {
        if (stock[i].item_id === choiceId) {
            return stock[i];
        }
    }
    return null;
}

