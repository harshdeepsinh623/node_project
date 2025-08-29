# Express EJS App

## Overview
This project is a simple task management application built with Express.js and EJS templating engine. It allows users to create, view, update, and delete tasks. The application also includes user authentication features for login and registration.

## Project Structure
```
express-ejs-app
├── src
│   ├── app.js                     # Entry point of the application
│   ├── controllers
│   │   └── taskController.js      # Handles task-related operations
│   ├── routes
│   │   ├── authRoutes.js          # Authentication routes (login, register)
│   │   └── taskRoutes.js          # Task management routes
│   ├── models
│   │   └── task.js                # Mongoose model for tasks
│   └── views
│       ├── partials
│       │   └── navbar.ejs         # Navigation bar included in other views
│       ├── taskList.ejs           # Displays the list of tasks
│       ├── taskForm.ejs           # Form for creating/editing tasks
│       ├── taskItem.ejs           # Structure for displaying a single task
│       ├── login.ejs              # Login form for user authentication
│       └── register.ejs           # Registration form for new users
├── public
│   └── styles.css                 # Styles for the application
├── package.json                    # npm configuration file
└── README.md                       # Project documentation
```

## Features
- User authentication (login and registration)
- Task management (create, read, update, delete)
- Responsive design with EJS views
- Navigation bar for easy access to different sections

## Installation
1. Clone the repository:
   ```
   git clone <repository-url>
   ```
2. Navigate to the project directory:
   ```
   cd express-ejs-app
   ```
3. Install the dependencies:
   ```
   npm install
   ```
4. Set up your environment variables in a `.env` file (e.g., `MONGODB_URI`, `FRONTEND_URL`, etc.).
5. Start the application:
   ```
   npm start
   ```

## Usage
- Access the application in your browser at `http://localhost:5000`.
- Use the navigation bar to navigate between the task list, login, and registration pages.

## Contributing
Contributions are welcome! Please open an issue or submit a pull request for any improvements or bug fixes.

## License
This project is licensed under the MIT License.