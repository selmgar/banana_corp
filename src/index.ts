import 'dotenv/config';
import { select, input } from '@inquirer/prompts';
import pg from 'pg';

// START - database configuration
const { Client } = pg;
const client = new Client({
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: 'banana_corp',
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT || 5432,
});

client.connect();

// END - database configuration
async function mainMenu() {
  const answer = await select(
    {
      message: 'What would you like to do?',
      choices: [
        {
          name: 'View all departments',
          value: 'view_departments'
        },
        {
          name: 'View all roles',
          value: 'view_roles'
        },
        {
          name: 'View all employees',
          value: 'view_employees'
        },
        {
          name: 'Add a department',
          value: 'add_department'
        },
        {
          name: 'Add a role',
          value: 'add_role'
        },
        {
          name: 'Add an employee',
          value: 'add_employee'
        },
        {
          name: 'Update an employee role',
          value: 'update_employee_role'
        },
        {
          name: 'Exit',
          value: 'exit'
        }
      ],
    });

  // Uses the answer to determine which switch case to use.
  switch (answer) {
    case 'view_departments':
      viewDepartments();
      break;
    case 'view_roles':
      viewRoles();
      break;
    case 'view_employees':
      viewEmployees();
      break;
    case 'add_department':
      addDepartment();
      break;
    case 'add_role':
      addRole();
      break;
    case 'add_employee':
      addEmployee();
      break;
    case 'update_employee_role':
      updateEmployeeRole();
      break;
    case 'exit':
      client.end();
      console.log("Goodbye!");
      process.exit();
  }
}

/**
 * Queries the database for all departments and logs the results to the console.
 */
async function viewDepartments() {
  const res = await client.query('SELECT id, name FROM department');
  console.table(res.rows);
  mainMenu();
}

/**
 * Queries the database for all roles and logs the results to the console.
 */
async function viewRoles() {
  const res = await client.query(
    ` SELECT role.id, role.title, department.name AS department, role.salary
      FROM role
      JOIN department ON role.department = department.id`
  );
  console.table(res.rows);
  mainMenu();
}

/**
 * Queries the database for all employees and logs the results to the console.
 */
async function viewEmployees() {
  // COALESCE is used to display 'None' if the employee does not have a manager.
  // The AS keyword is used to rename the column to 'manager'.
  const res = await client.query(
    ` SELECT 
        employee.id, 
        employee.first_name, 
        employee.last_name, 
        role.title, 
        department.name AS department, 
        role.salary, 
        COALESCE(manager.first_name || ' ' || manager.last_name, 'None') AS manager
      FROM employee
      JOIN role ON employee.role_id = role.id
      JOIN department ON role.department = department.id
      LEFT JOIN employee AS manager ON employee.manager_id = manager.id
    `
  );
  console.table(res.rows);
  mainMenu();
}


/**
 * Prompts the user for the name of the department to add and inserts it into the database.
 */
async function addDepartment() {
  const answer = await input(
    {
      message: 'Enter the name of the department:',
    },
  );

  // Inserts the department into the database.
  await client.query('INSERT INTO department (name) VALUES ($1)', [answer]);
  console.log(`Added ${answer} to the database.`);
  mainMenu();
}

/**
 * Prompts the user for the name, salary, and department of the role to add and inserts it into the database.
 */
async function addRole() {
  // Queries the database for all departments and maps the results to an array of objects.
  const departments = await client.query('SELECT id, name FROM department');
  const departmentChoices = departments.rows.map(({ id, name }) => ({
    name: name,
    value: id,
  }));

  const title = await input({
      message: 'Enter the name of the role:',
  });
  const salary = await input({
      message: 'Enter the salary for the role:',
  });
  const department = await select({
    message: 'Select the department for the role:',
    choices: departmentChoices,
  });

  // Inserts the role into the database.
  await client.query(
    'INSERT INTO role (title, salary, department) VALUES ($1, $2, $3)',
    [title, salary, department]
  );
  console.log(`Added ${title} to the database.`);
  mainMenu();
}

/**
 * Prompts the user for the first name, last name, role, and manager of the employee to add and inserts it into the database.
 */
async function addEmployee() {
  // Queries the database for all roles and maps the results to an array of objects.
  const roles = await client.query('SELECT id, title FROM role');
  const roleChoices = roles.rows.map(({ id, title }) => ({
    name: title,
    value: id,
  }));

  // Queries the database for all employees and maps the results to an array of objects.
  const employees = await client.query('SELECT id, first_name, last_name FROM employee');
  const managerChoices = employees.rows.map(({ id, first_name, last_name }) => ({
    name: `${first_name} ${last_name}`,
    value: id,
  }));

  // Adds a 'None' option to the managerChoices array.
  managerChoices.unshift({ name: 'None', value: null });

  // Prompts the user for the first name, last name, role, and manager of the employee.
  const firstName = await input({
    message: "Enter the employee's first name:",
  });

  const lastName = await input({
    message: "Enter the employee's last name:",
  });

  const role = await select({
    message: "Select the employee's role:",
    choices: roleChoices,
  });

  const manager = await select({
    message: "Select the employee's manager:",
    choices: managerChoices,
  });

  // Inserts the employee into the database.
  await client.query(
    'INSERT INTO employee (first_name, last_name, role_id, manager_id) VALUES ($1, $2, $3, $4)',
    [firstName, lastName, role, manager]
  );
  console.log(`Added ${firstName} ${lastName} to the database.`);
  mainMenu();
}

/**
 * Prompts the user to select an employee and a new role for the employee and updates the employee's role in the database.
 */
async function updateEmployeeRole() {
  // Queries the database for all employees and maps the results to an array of objects.
  const employees = await client.query('SELECT id, first_name, last_name FROM employee');
  const employeeChoices = employees.rows.map(({ id, first_name, last_name }) => ({
    name: `${first_name} ${last_name}`,
    value: id,
  }));

  // Queries the database for all roles and maps the results to an array of objects.
  const roles = await client.query('SELECT id, title FROM role');
  const roleChoices = roles.rows.map(({ id, title }) => ({
    name: title,
    value: id,
  }));

  // Prompts the user to select an employee and a new role for the employee.
  const employee = await select({
    message: 'Select the employee to update:',
    choices: employeeChoices,
  });
  const role = await select({
    message: 'Select the new role for the employee:',
    choices: roleChoices,
  });

  // Updates the employee's role in the database.
  await client.query(
    'UPDATE employee SET role_id = $1 WHERE id = $2',
    [role, employee]
  );
  console.log("Updated employee's role in the database.");
  mainMenu();
}

mainMenu();
