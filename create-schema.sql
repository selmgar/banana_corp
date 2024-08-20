-- Drop the database if it exists
DROP DATABASE IF EXISTS banana_corp;

-- Create the new database
CREATE DATABASE banana_corp;

-- Connect to the newly created database
\c banana_corp;

-- Create the department table
CREATE TABLE department (
    id SERIAL PRIMARY KEY,
    name VARCHAR(30) NOT NULL
);

-- Create the role table
CREATE TABLE role (
    id SERIAL PRIMARY KEY,
    title VARCHAR(30) NOT NULL,
    salary DECIMAL NOT NULL,
    department INTEGER REFERENCES department(id)
);

-- Create the employee table
CREATE TABLE employee (
    id SERIAL PRIMARY KEY,
    first_name VARCHAR(30) NOT NULL,
    last_name VARCHAR(30) NOT NULL,
    role_id INTEGER REFERENCES role(id),
    manager_id INTEGER REFERENCES employee(id)
);

-- Insert data into the department table
INSERT INTO department (name)
VALUES
    ('Engineering'),
    ('Human Resources'),
    ('Sales'),
    ('Marketing');

-- Insert data into the role table
INSERT INTO role (title, salary, department)
VALUES
    ('Software Engineer', 85000, 1),
    ('HR Specialist', 60000, 2),
    ('Sales Manager', 75000, 3),
    ('Marketing Coordinator', 65000, 4),
    ('Senior Software Engineer', 105000, 1),
    ('HR Manager', 80000, 2),
    ('Sales Representative', 50000, 3);

-- Insert data into the employee table
INSERT INTO employee (first_name, last_name, role_id, manager_id)
VALUES
    ('John', 'Doe', 1, NULL),
    ('Jane', 'Smith', 2, NULL),
    ('Alice', 'Johnson', 3, NULL),
    ('Bob', 'Williams', 4, NULL),
    ('Charlie', 'Brown', 5, 1), -- Senior Software Engineer under John Doe
    ('Diana', 'Prince', 6, 2), -- HR Manager under Jane Smith
    ('Eve', 'Davis', 7, 3); -- Sales Representative under Alice Johnson