# 🏛️ Student Feedback Analyzer

This is a full-stack web application designed to help educational institutions (specifically principals) manage students, subjects, and collect/analyze feedback from students regarding subject/teacher performance. Students can submit feedback for subjects in their section and view their submission history.

---

## ✨ Features

* **User Authentication**: Secure login system for different user roles (Principal, Student).
* **Principal Dashboard**:
    * Select and manage specific academic sections.
    * Add new students to a chosen section.
    * Add new subjects to a chosen section (allows same subject name in different sections).
    * View a list of all registered students in a selected section.
    * View detailed feedback analysis for subjects, including:
        * Overall sentiment breakdown (Positive, Neutral, Negative).
        * Average ratings for teaching, knowledge, and behavior.
        * Comment sentiment breakdown (using a rule-based analysis).
        * List of students who haven't submitted feedback for a specific subject.
* **Student Dashboard**:
    * Displays student's email and ID upon login.
    * Submit feedback for subjects *only* within their assigned section.
    * View their own feedback submission history.
* **Smooth UI/UX**: Elegant design with subtle animations and transitions for a modern feel.

---

## 🚀 Technologies Used

### Backend:

* **Node.js**: JavaScript runtime environment.
* **Express.js**: Web framework for Node.js.
* **MongoDB**: NoSQL database for data storage.
* **Mongoose**: ODM (Object Data Modeling) library for MongoDB and Node.js.
* **Bcrypt.js**: For password hashing.
* **JSON Web Tokens (JWT)**: For secure authentication.
* **Dotenv**: For managing environment variables.
* **Nodemon**: For automatic server restarts during development.

### Frontend:

* **HTML5**: Structure of the web pages.
* **CSS3**: Styling with a custom, elegant, and colorful theme with smooth animations.
* **JavaScript (ES6+)**: Frontend logic, API interactions, and dynamic UI updates.

---

## 📁 Project Structure

The project is organized into two main top-level folders, each containing its own application:

* `config/`: MongoDB connection setup.
* `controllers/`: Application logic for handling requests (users, subjects, feedback).
* `middleware/`: Authentication and authorization middleware.
* `models/`: Mongoose schemas for MongoDB collections (User, Subject, Feedback, Section).
* `routes/`: API routes for the backend.
* `public/`: All frontend static files (HTML, CSS, JavaScript).
    * `public/css/`: Stylesheets.
    * `public/js/`: Frontend JavaScript logic.

---

## 🏁 Getting Started

Follow these instructions to get a copy of the project up and running on your local machine for development and testing purposes.

### Prerequisites

Before you begin, ensure you have the following installed:

* **Node.js**: [Download & Install Node.js](https://nodejs.org/en/download/) (includes npm).
* **MongoDB**:
    * **Local Installation**: [Download & Install MongoDB Community Server](https://www.mongodb.com/try/download/community)
    * **Cloud (Recommended for beginners)**: Set up a free tier account on [MongoDB Atlas](https://www.mongodb.com/cloud/atlas).
* **Git**: [Download & Install Git](https://git-scm.com/downloads).
* **MongoDB Compass (Optional but Recommended)**: A GUI for MongoDB to easily view and manage your database. [Download MongoDB Compass](https://www.mongodb.com/products/compass).

### Installation

1.  **Clone the repository:**
    ```bash
    git clone [https://github.com/YOUR_USERNAME/student-feedback-analyzer.git](https://github.com/YOUR_USERNAME/student-feedback-analyzer.git)
    cd student-feedback-analyzer
    ```
    (Replace `YOUR_USERNAME` with your actual GitHub username and adjust the repository name if different).

2.  **Install Backend Dependencies:**
    ```bash
    npm install
    ```

3.  **Set up Environment Variables:**
    Create a file named `.env` in the root of your project directory (`student-feedback-analyzer/.env`).
    Add the following content to it:

    ```env
    MONGO_URI=your_mongodb_connection_string
    JWT_SECRET=a_strong_secret_key_for_jwt_signing
    PORT=5000
    ```
    * **`MONGO_URI`**:
        * **For MongoDB Atlas**: Go to your Atlas cluster, click "Connect", choose "Connect your application", and copy the connection string. Replace `<username>`, `<password>`, and `<dbname>` with your actual database user credentials and desired database name (e.g., `feedback_analyzer`).
        * **For Local MongoDB**: Typically `mongodb://localhost:27017/feedback_analyzer`.
    * **`JWT_SECRET`**: Generate a long, random string. You can use an online tool or generate one with Node.js: `require('crypto').randomBytes(64).toString('hex')`.

4.  **🔑 CRUCIAL: MongoDB Index Correction for Subjects**

    Due to a common Mongoose behavior, an old unique index on just the `name` field of subjects might exist in your MongoDB database, preventing you from having subjects with the same name in different sections. You **must** manually remove this old index.

    * **Stop your Node.js server (if it's running) by pressing `Ctrl + C` in your terminal.**
    * **Open MongoDB Compass or access the `mongosh` shell directly.**
    * **Navigate to your `feedback_analyzer` database (or whatever you named it).**
    * **In the MongoDB Shell/Query Tab, run these commands:**

        ```javascript
        // 1. Switch to your database (if not already there)
        use feedback_analyzer;

        // 2. List all existing indexes on the 'subjects' collection
        db.subjects.getIndexes();

        // 3. Look for an index with "name" : "name_1" and "unique" : true.
        //    If you find it, run the command to drop it:
        db.subjects.dropIndex("name_1");

        // 4. Verify the index is gone (you should NO LONGER see "name_1" in the output)
        db.subjects.getIndexes();

        // 5. (Optional) Inspect your existing subject documents.
        //    If any older documents lack a 'section' field, this could also cause issues
        //    with the compound index. You might need to add a default 'section' value
        //    to them or delete them if they are test data.
        // db.subjects.find({}).pretty();
        ```
    * This step is vital. Once the `name_1` index is removed, your application's `Subject` model (which defines a compound unique index on `name` and `section`) will correctly apply when the server restarts.

### Running the Application

1.  **Start the Backend Server:**
    ```bash
    npm run dev
    ```
    You should see messages like "Server running on port 5000" and "MongoDB Connected" in your terminal.

2.  **Access the Frontend:**
    Open your web browser and navigate to:
    ```
    http://localhost:5000
    ```

---

## 👨‍💻👩‍💻 Usage

### Default Credentials (for first time use):

* **Principal:**
    * **Email:** `principal@example.com`
    * **Password:** `defaultprincipalpass`
* **Student:** (You'll need to create students via the Principal dashboard first.)
    * **Example:** `student@example.com`, `defaultstudentpass`, `S001`, `YOUR_SECTION_NAME`

### Application Flow:

1.  **Login Page**: Log in as either Principal or Student.
2.  **Principal Flow**:
    * Upon first Principal login, you'll be redirected to `Principal Section Selection`.
    * **Add Section**: Enter a section name (e.g., `10TH GRADE`, `SECTION A`) and add it.
    * **Select Section**: Choose an existing section from the dropdown and click "Proceed to Dashboard".
    * **Principal Dashboard**:
        * Use the navigation buttons ("Add Student", "Add Subject", "View Students", "View Feedback") to switch between functionalities.
        * **Add Student**: Create new student accounts, assigning them to the currently selected section.
        * **Add Subject**: Create new subjects for the current section. You can add a subject with the same name (e.g., "Mathematics") to different sections (e.g., "Mathematics" in "10TH GRADE" and "Mathematics" in "11TH GRADE").
        * **View Students**: See a list of all students in the current section.
        * **View Feedback**: Select a subject and load its feedback analysis, including ratings breakdown, comment sentiment, and a list of students who haven't submitted feedback for that specific subject.
3.  **Student Flow**:
    * Log in using the credentials of a student created by the Principal.
    * Your email and Student ID will be displayed at the top.
    * **Submit New Feedback**: Select a subject *from your assigned section only*, provide ratings, and add comments.
    * **View My Feedback**: See a history of all the feedback you have submitted.

---

## 🤝 Contributing

Feel free to fork the repository, open issues, or submit pull requests.

---

## 📄 License

This project is open-source and available under the [MIT License](LICENSE).
