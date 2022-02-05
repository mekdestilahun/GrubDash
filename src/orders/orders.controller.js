const path = require("path");

// Use the existing order data
const orders = require(path.resolve("src/data/orders-data"));

// Use this function to assigh ID's when necessary
const nextId = require("../utils/nextId");

//orders middleware  

function orderExists  (req, res, next)  {
  const { orderId } = req.params;
  const foundOrder = orders.find((order) => order.id == orderId);
  if (foundOrder) {
    res.locals.order = foundOrder;
    next();
  }
  next({
    status: 404,
    message: `Order with id ${orderId} does not exist`,
  });
};

function validateOrderProperties(req, res, next)  {
  const { data: { deliverTo, mobileNumber, dishes, quantity, status }} = req.body;
  if (!deliverTo || deliverTo == "")
    return next({
      status: 400, 
      message: "Order must include a deliverTo"
    });
  if (!mobileNumber || mobileNumber == "")
    return next({
      status: 400, 
      message: "Order must include a mobileNumber"
    });
  if (!dishes)
    return next({
      status: 400, message: 
      "Order must include a dish"
    });
  else if (!Array.isArray(dishes) || dishes.length <= 0)
    return next({
      status: 400,
      message: "Order must include at least one dish",
    });
  dishes.forEach(dish => {
    const quantity = dish.quantity;
    if(!quantity || !Number.isInteger(quantity) || quantity <=0)  {
      return next({
        status: 400,
        message: `Dish ${dish.id} must have a quantity that is an integer greater than 0`,
      });
    }
  })
  res.locals.newOrder = {
    id: nextId(),
    deliverTo: deliverTo,
    mobileNumber: mobileNumber,
    status: status,
    dishes: dishes,
  };
  next();
};

function list  (req, res, next)  {
  res.json({ data: orders });
};

function read  (req, res, next)  {
  res.json({ data: res.locals.order });
};

function create  (req, res, next)  {
  orders.push(res.locals.newOrder);
  res.status(201).json({ data: res.locals.newOrder });
};

function update  (req, res, next)  {
  const { orderId } = req.params;
  const originalOrder = res.locals.order;
  const {
    data: { id, deliverTo, mobileNumber, status, dishes }} = req.body;
  if (id && id !== orderId)
    return next({
      status: 400,
      message: `Order id does not match route id. Order: ${id}, Route: ${orderId}`,
    });
  if (!status || status == "")
    return next({
      status: 400, 
      message: `Order must include a status`
    });
  if (status === "invalid")
    return next({
      status: 400, 
      message: `Order status must be valid` });
  if (status === "delivered")
    return next({
      status: 400,
      message: `A delivered order cannot be changed.`,
    });
  res.locals.order = {
    id: originalOrder.id,
    deliverTo: deliverTo,
    mobileNumber: mobileNumber,
    status: status,
    dishes: dishes,
  };
  res.json({ data: res.locals.order });
};

function destroy (req, res, next) {
  const { orderId } = req.params;
  const order = orders.find((order) => order.id == orderId);
  if(order.status !== "pending")
    return next({
      status: 400,
      message: `An order cannot be deleted unless it is pending`,
    });
  else {
    orders.splice(order, 1);
    res.sendStatus(204)
  }
};

module.exports = {
  list,
  read: [orderExists, read],
  create: [validateOrderProperties, create],
  update: [validateOrderProperties, orderExists, update],
  delete: [orderExists, destroy],
};