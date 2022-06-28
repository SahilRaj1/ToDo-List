const express = require('express');
const bodyParser = require('body-parser');
const ejs = require('ejs');
const mongoose = require('mongoose');
const _ = require('lodash');

const app = express();
const port = 3000;

app.set("view engine", "ejs");
app.use(express.urlencoded({extended: true}));
app.use(express.static("public"));

mongoose.connect("mongodb+srv://admin-raj24sahil:mongosahil@cluster0.thhqk.mongodb.net/todolistDB")

const itemsSchema = {
    name: String
};

const Item = mongoose.model("Item", itemsSchema);

const item1 = new Item({
    name: "Welcome to todolist"
});
const item2 = new Item({
    name: "Hit the + button to add a new item"
});
const item3 = new Item({
    name: "<-- Hit this to delete an item"
});

const defaultItems = [item1, item2, item3];

const listSchema = {
    name: String,
    items: [itemsSchema]
}

const List = mongoose.model("List", listSchema);

app.get("/", (req, res)=> {

    // reading from database
    Item.find({}, (err, foundItems)=> {

        if (foundItems.length === 0) {
            Item.insertMany(defaultItems, (err)=> {
                if (err) {
                    console.log(err);
                } else {
                    console.log("Sucessfully added");
                }
            });
            res.redirect("/");
        } else {
            // console.log(foundItems);
            res.render("list", {listTitle: "Today", newItems: foundItems});
        }
    })

});

app.get("/:customListName", (req, res)=> {
    const customListName = _.capitalize(req.params.customListName);

    List.find({name: customListName}, (err, foundList)=> {
        if (!err) {
            if (foundList.length===0) {
                const list = new List({
                    name: customListName,
                    items: defaultItems
                });
            
                list.save();
                res.redirect(`/${customListName}`)
            } else {
                // console.log(foundList);
                res.render("list", {listTitle: foundList[0].name, newItems: foundList[0].items})
            }
        }
    });
    
});

app.post("/", (req, res)=> {
    // console.log(req.body.task);
    const itemName = req.body.task;
    const listName = req.body.list;
    const item = new Item({
        name: itemName
    });

    if (listName==="Today") {
        item.save();
        res.redirect("/");
    } else {
        List.findOne({name: listName}, (err, foundList)=> {
            foundList.items.push(item);
            foundList.save();
            res.redirect(`/${listName}`);
        });
    }
})

app.post("/delete", (req, res)=> {
    const delItem = req.body.deleteItem;
    const listName = req.body.listName;
    // console.log(delItem);

    if (listName==="Today") {
        Item.findByIdAndRemove(delItem, (err)=> {
            if (err) {
                console.log(err);
            } else {
                console.log("Sucessfully removed");
                res.redirect("/");
            }
        });
    } else {
        List.findOneAndUpdate({name: listName}, {$pull: {items: {_id: delItem}}}, (err, foundList)=> {
            if (!err) {
                res.redirect(`/${listName}`);
            }
        });
    }
});

app.use((req, res)=> {
    res.status(404).send(`<h1>Error 404<br>Page not Found<h1>`);
})

app.listen(port, ()=> {
    console.log(`Server is running on port ${port}...`);
});

