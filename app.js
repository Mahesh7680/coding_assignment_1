const express = require("express");
const app = express();
app.use(express.json());
const sqlite3 = require("sqlite3");
const path = require("path");
const { open } = require("sqlite");
const date_fns = require("date-fns");
var isValid = require("date-fns/isValid");
var format = require("date-fns/format");

const dbPath = path.join(__dirname, "todoApplication.db");
let db;

const initializeDbAndServer = async () => {
  try {
    db = await open({ filename: dbPath, driver: sqlite3.Database });
    app.listen(3000, () => {
      console.log("server running");
    });
  } catch (e) {
    console.log(`DB Error : ${e.message}`);
    process.exit(1);
  }
};

initializeDbAndServer();

module.exports = app;

// const middleWareFunctionForValidDay = (request, response, next) => {
//   const dateFormat = (request.query.date) => {
//     return format(new Date(dateObj), "yyyy-MM-dd");
//   };
// };
//convertSnakeCaseIntoCamelCase;

const convertSnakeIntoCamel = (item) => {
  return {
    id: item.id,
    todo: item.todo,
    priority: item.priority,
    status: item.status,
    category: item.category,
    dueDate: item.due_date,
  };
};

const statusQuery = (requestBody) => {
  return requestBody.status !== undefined;
};

const priorityQuery = (requestBody) => {
  return requestBody.priority !== undefined;
};

const categoryQuery = (requestBody) => {
  return requestBody.category !== undefined;
};

const priorityAndStatusQuery = (requestBody) => {
  return requestBody.priority !== undefined && requestBody.status !== undefined;
};

const categoryAndStatusQuery = (requestBody) => {
  return requestBody.category !== undefined && requestBody.status !== undefined;
};

const categoryAndPriorityQuery = (requestBody) => {
  return (
    requestBody.priority !== undefined && requestBody.category !== undefined
  );
};

//GET                       API - 1

app.get("/todos/", async (request, response) => {
  const requestBody = request.query;
  const { search_q = "", status, priority, category } = requestBody;
  let getTodoQuery = "";
  switch (true) {
    case statusQuery(requestBody):
      getTodoQuery = `
      SELECT *
      FROM todo
      WHERE 
      todo LIKE '%${search_q}%'
      AND status = '${status}';`;
      break;
    case priorityQuery(requestBody):
      getTodoQuery = `
      SELECT *
      FROM todo
      WHERE 
      todo LIKE '%${search_q}%'
      AND priority = '${priority}';`;
      break;
    case categoryQuery(requestBody):
      getTodoQuery = `
      SELECT *
      FROM todo
      WHERE 
      todo LIKE '%${search_q}%'
      AND category = '${category}';`;
      break;
    case priorityAndStatusQuery(requestBody):
      getTodoQuery = `
      SELECT *
      FROM todo
      WHERE 
      todo LIKE '%${search_q}'%
      AND priority = '${priority}'
      AND status = '${status}';`;
      break;
    case categoryAndStatusQuery(requestBody):
      getTodoQuery = `
      SELECT *
      FROM todo
      WHERE 
      todo LIKE '%${search_q}%'
      AND category = '${category}'
      AND status = '${status}';`;
      break;
    case categoryAndPriorityQuery(requestBody):
      getTodoQuery = `
      SELECT *
      FROM todo
      WHERE 
      todo LIKE '%${search_q}%'
      AND category = '${category}'
      AND priority = '${priority}'`;
      break;
    default:
      getTodoQuery = `
      SELECT *
      FROM todo
      WHERE 
      todo LIKE '%${search_q}%'`;
  }
  const dbResponse = await db.all(getTodoQuery);
  response.send(
    dbResponse.map((each) => {
      return convertSnakeIntoCamel(each);
    })
  );
});

//GET SINGLE                API - 2

app.get("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  const getTodoQuery = `
      SELECT *
      FROM todo
      WHERE 
      id = ${todoId}`;
  const dbResponse = await db.get(getTodoQuery);
  response.send(convertSnakeIntoCamel(dbResponse));
});

//GET                       API - 3

app.get("/agenda", async (request, response) => {
  const { date = "" } = request.query;
  let dateFormatted = format(new Date(date), "yyyy-MM-dd");
  const getTodoQuery = `
      SELECT *
      FROM todo
      WHERE 
      due_date = '${dateFormatted}'`;
  const dbResponse = await db.all(getTodoQuery);

  if (dbResponse.length === 0) {
    response.status(400);
    response.send("Invalid Due Date");
  } else {
    response.send(
      dbResponse.map((each) => {
        return convertSnakeIntoCamel(each);
      })
    );
  }
});

//POST                      API - 4

app.post("/todos/", async (request, response) => {
  const todoDetails = request.body;
  const { id, todo, priority, status, category, dueDate } = todoDetails;
  const addNewTodo = `
  INSERT INTO 
  todo(id, todo, priority, status, category, due_date)
  VALUES(
      ${id},
      '${todo}',
      '${priority}',
      '${status}',
      '${category}',
      '${dueDate}'
  );`;
  await db.run(addNewTodo);
  response.send("Todo Successfully Added");
});

//POst                      API - 5

app.put("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  const { todo, priority, status, category, dueDate } = request.body;
  let updateQuery;
  let sendResponse;
  if (todo !== undefined) {
    updateQuery = `
        UPDATE todo
        SET 
            todo = '${todo}'
        WHERE
            id = ${todoId}`;
    sendResponse = "Todo";
  }
  if (priority !== undefined) {
    updateQuery = `
        UPDATE todo
        SET 
            priority = '${priority}'
        WHERE
            id = ${todoId}`;
    sendResponse = "Priority";
  }
  if (status !== undefined) {
    updateQuery = `
        UPDATE todo
        SET 
            status = '${status}'
        WHERE
            id = ${todoId}`;
    sendResponse = "Status";
  }
  if (category !== undefined) {
    updateQuery = `
        UPDATE todo
        SET 
            category = '${category}'
        WHERE
            id = ${todoId}`;
    sendResponse = "Category";
  }
  if (dueDate !== undefined) {
    updateQuery = `
        UPDATE todo
        SET 
            due_date = '${dueDate}'
        WHERE
            id = ${todoId}`;
    sendResponse = "Due Date";
  }
  const dbResponse = await db.run(updateQuery);
  response.send(`${sendResponse} Updated`);
});

// DELETE                   API - 6

app.delete("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  const deleteQuery = `
  DELETE FROM todo
  WHERE id = ${todoId};`;
  await db.run(deleteQuery);
  response.send("Todo Deleted");
});
