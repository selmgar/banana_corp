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

async function viewDepartments() {
  const res = await client.query('SELECT id, name FROM department');
  console.table(res.rows);
  mainMenu();
}

async function viewRoles() {
  const res = await client.query(
    ` SELECT role.id, role.title, department.name AS department, role.salary
      FROM role
      JOIN department ON role.department = department.id`
  );
  console.table(res.rows);
  mainMenu();
}

async function viewEmployees() {
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

async function addDepartment() {
  const answer = await input(
    {
      message: 'Enter the name of the department:',
    },
  );

  
  await client.query('INSERT INTO department (name) VALUES ($1)', [answer]);
  console.log(`Added ${answer} to the database.`);
  mainMenu();
}

async function addRole() {
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

  await client.query(
    'INSERT INTO role (title, salary, department) VALUES ($1, $2, $3)',
    [title, salary, department]
  );
  console.log(`Added ${title} to the database.`);
  mainMenu();
}

async function addEmployee() {
  const roles = await client.query('SELECT id, title FROM role');
  const roleChoices = roles.rows.map(({ id, title }) => ({
    name: title,
    value: id,
  }));

  const employees = await client.query('SELECT id, first_name, last_name FROM employee');
  const managerChoices = employees.rows.map(({ id, first_name, last_name }) => ({
    name: `${first_name} ${last_name}`,
    value: id,
  }));

  managerChoices.unshift({ name: 'None', value: null });

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

  await client.query(
    'INSERT INTO employee (first_name, last_name, role_id, manager_id) VALUES ($1, $2, $3, $4)',
    [firstName, lastName, role, manager]
  );
  console.log(`Added ${firstName} ${lastName} to the database.`);
  mainMenu();
}

async function updateEmployeeRole() {
  const employees = await client.query('SELECT id, first_name, last_name FROM employee');
  const employeeChoices = employees.rows.map(({ id, first_name, last_name }) => ({
    name: `${first_name} ${last_name}`,
    value: id,
  }));

  const roles = await client.query('SELECT id, title FROM role');
  const roleChoices = roles.rows.map(({ id, title }) => ({
    name: title,
    value: id,
  }));

  const employee = await select({
    message: 'Select the employee to update:',
    choices: employeeChoices,
  });
  const role = await select({
    message: 'Select the new role for the employee:',
    choices: roleChoices,
  });

  await client.query(
    'UPDATE employee SET role_id = $1 WHERE id = $2',
    [role, employee]
  );
  console.log("Updated employee's role in the database.");
  mainMenu();
}

mainMenu();
