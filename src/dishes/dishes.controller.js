const path = require("path");

// Use the existing dishes data
const dishes = require(path.resolve("src/data/dishes-data"));

// Use this function to assign ID's when necessary
const nextId = require("../utils/nextId");

// Middleware

function dishExists(req,res,next) {
  const {dishId } = req.params
  const foundDish = dishes.find((dish)=> dish.id === dishId)

  if(foundDish){
      res.locals.dish = foundDish
      return next ()
  }
  next({
      status: 404,
      message:`Dish does not exist ${dishId}`
  })
}

function validateDishProperties(req, res, next) {
  const { data:{description, price, name, image_url} } = req.body;
  
  if(!description || description === "") 
    return next({
      status: 400, 
      message: "Dish must include a description"
    });
  
  if(!price) 
    return next({
      status: 400,
      message: "Dish must include a price" 
    });
  else if(typeof price !== "number" || price <= 0) 
    return next({
      status: 400, 
      message: "Dish must have a price that is an integer greater than 0",
    });
  
  if(!name || name == "") 
     return next({
       status: 400, 
       message: 'Dish must include a name'});
  
  if (!image_url || image_url == "") 
     return next({ status: 400, message: "Dish must include an image_url" 
     })
  next();

}
 

function list(req, res) {
  res.json({ data: dishes })
}

function create (req, res){
    const {data:{ name, description, price, image_url },} = req.body;
    const newDish ={
        id: nextId (),
        name,
        description,
        price,
        image_url,
    }
    dishes.push(newDish);
    res.status(201).json({data:newDish});
}

function read(req, res, next) {
  res.json({ data: res.locals.dish });
}

function update(req, res, next) {
  const { data: { name, description, price, image_url } = {} } = req.body;
  const { dishId } = req.params;
  const index = dishes.findIndex((dish) => dish.id === dishId);
  dishes[index] = { id: dishId, name, description, price, image_url };

  res.status(200).json({ data: dishes[index] });
}

function checkForMatchingId(req, res, next) { 
  const { dishId } = req.params; 
  const { data: { id } = {} } = req.body;
  if (id) {
    if (id === dishId) {
     next();
    }
    next({
      status: 400,
      message: `Dish id in url (${dishId}) does not match id in request body (${id})`,
    });
  }
  next();
}





module.exports = {
  list,
  read:[dishExists,read],
  create:[validateDishProperties,create],
  update:[dishExists, validateDishProperties, checkForMatchingId, update]
};



