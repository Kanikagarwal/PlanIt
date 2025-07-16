//jshint esversion:6
const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const _ = require("lodash")
const dotenv = require("dotenv")


const app = express();

app.set('view engine', 'ejs');

dotenv.config()
app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));
mongoose.connect("mongodb://127.0.0.1:27017/toDoListDB",{useNewUrlParser:true});

const itemsSchema = new mongoose.Schema({
  name: String
})
const Item = mongoose.model("Item", itemsSchema)

const buy = new Item({
  name: "Buy Food"
})
const cook = new Item({
  name: "Cook Food"
})
const eat = new Item({
  name: "Eat Food"
})
const defaultItems = [buy, cook, eat];

const listSchema = new mongoose.Schema({
  name: String,
  items: [itemsSchema]
})
const List = mongoose.model("List", listSchema)

var day = "";

app.get("/", function(req, res) {
  const today = new Date();
  const options = {
    weekday: "long",
    month: "long",
    day:"numeric"
  }
  day = today.toLocaleDateString("en-US", options);
  Item.find({}).then(function (foundItems) {
    if (foundItems.length === 0) {
      // Insert default items if no items found
      Item.insertMany(defaultItems).then(function (err) {
        if (err) {
          console.log(err);
        } else {
          console.log("Success");
        }
      });
      res.redirect("/");
    } else {
      res.render("list", { listTitle: day, newListItems: foundItems });
    }
  });
});


app.post("/", function(req, res){

  const itemName = req.body.newItem;
  const listName = req.body.list;
  const item = new Item({
    name: itemName
  })
  if(listName === day){
    item.save();
    res.redirect("/");
  }
  else{
List.findOne({name: listName}).then(function (foundList) {
   foundList.items.push(item);
   foundList.save();
   res.redirect("/"+listName)
})
  }
});
app.post("/delete",function (req,res) {
  const checkItemId = req.body.delete;
  const listName = req.body.listName;
  if(listName === day){
    Item.findByIdAndRemove(checkItemId).then(function (err) {
        res.redirect("/");
      })
  }
  else{
     List.findOneAndUpdate({name: listName},{$pull:{items: {_id:checkItemId}}}).then(function (foundList) {
      res.redirect("/"+listName);
     })
    }})
 

app.get("/:routeName",function (req,res) {
  const newRoute = _.capitalize(req.params.routeName);
  List.findOne({name: newRoute}).then(function (foundList) {
     if(!foundList){
      //Create a new list
      const list = new List({
        name: newRoute,
        items: defaultItems
      })
      list.save();
      res.redirect("/"+newRoute)
     }
     else{
      res.render("list",{ listTitle: foundList.name, newListItems: foundList.items })
     }
    
  })
})

app.get("/about", function(req, res){
  res.render("about");
});


app.listen(process.env.PORT, function() {
  console.log("Server started on port 3000");
});
