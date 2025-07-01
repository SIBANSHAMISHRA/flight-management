import React, { useState, useEffect } from "react";
import axios from "axios";

const API = "https://00615303-1375-4cce-b8a7-296db926de7b-00-itlq4wwb4xx7.sisko.replit.dev";

export default function App() {
  const [isAdmin, setIsAdmin] = useState(false);
  const [userId, setUserId] = useState(null);
  const [form, setForm] = useState({ name: "", dob: "", email: "", gender: "" });
  const [balance, setBalance] = useState(0);
  const [amountToAdd, setAmountToAdd] = useState("");
  const [courses, setCourses] = useState([]);
  const [progress, setProgress] = useState([]);
  const [students, setStudents] = useState([]);
  const [adminProgress, setAdminProgress] = useState([]);
  const [newCourse, setNewCourse] = useState({ name: "", description: "", cost: "" });
  const [newTask, setNewTask] = useState({ courseId: "", task: "", cost: "" });

  useEffect(() => {
    fetchCourses();
    if (userId) {
      fetchBalance();
      fetchProgress();
    }
  }, [userId]);

  const fetchCourses = () => axios.get(`${API}/courses`).then(res => setCourses(res.data));
  const fetchBalance = () => axios.get(`${API}/balance/${userId}`).then(res => setBalance(res.data.balance));
  const fetchProgress = () => axios.get(`${API}/progress/${userId}`).then(res => setProgress(res.data));
  const fetchStudents = () => axios.get(`${API}/admin/students`).then(res => setStudents(res.data));
  const fetchAdminProgress = () => axios.get(`${API}/admin/progress`).then(res => setAdminProgress(res.data));

  const registerStudent = () => {
    const { name, dob, email, gender } = form;
    if (!name || !dob || !email || !gender) return alert("Please fill all fields");
    axios.post(`${API}/register-student`, form).then(res => {
      setUserId(res.data.userId);
      alert("Registered successfully ✅");
    });
  };

  const addBalance = () => {
    const amount = parseInt(amountToAdd);
    if (!amount || amount <= 0 || amount > 10000) return alert("Amount must be between ₹1–₹10,000");
    axios.post(`${API}/add-balance`, { userId, amount }).then(() => {
      alert("Balance added 💰");
      fetchBalance();
      setAmountToAdd("");
    });
  };

  const enroll = (courseId) => {
    axios.post(`${API}/enroll`, { userId, courseId }).then(() => alert("Enrolled ✅")).catch(() => alert("Already enrolled"));
  };

  const completeTask = (taskId) => {
    axios.post(`${API}/complete-task`, { userId, taskId }).then(() => {
      alert("Task Completed ✅");
      fetchBalance();
      fetchProgress();
    }).catch(() => alert("❌ Already done or insufficient balance"));
  };

  const addCourse = () => {
    const { name, description, cost } = newCourse;
    if (!name || !description || !cost) return alert("Fill all course fields");
    axios.post(`${API}/admin/add-course`, { name, description, cost: parseInt(cost) })
      .then(() => { alert("Course added ✅"); setNewCourse({ name: "", description: "", cost: "" }); fetchCourses(); });
  };

  const addTask = () => {
    const { courseId, task, cost } = newTask;
    if (!courseId || !task || !cost) return alert("Fill all task fields");
    axios.post(`${API}/admin/add-task`, { courseId: parseInt(courseId), task, cost: parseInt(cost) })
      .then(() => { alert("Task added ✅"); setNewTask({ courseId: "", task: "", cost: "" }); });
  };

  return (
    <div className="p-6 font-sans bg-gray-900 text-white min-h-screen">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">✈️ Flight Management System</h1>
        <button onClick={() => setIsAdmin(!isAdmin)} className="bg-yellow-600 px-3 py-1 rounded">
          Switch to {isAdmin ? "Student" : "Admin"} Mode
        </button>
      </div>

      {!userId && !isAdmin && (
        <div className="bg-white/10 p-4 rounded mb-6">
          <h2 className="text-xl font-semibold mb-2">Student Registration</h2>
          {['name', 'dob', 'email', 'gender'].map(f => (
            <input key={f} className="text-black p-1 rounded mr-2 mb-2" placeholder={f} value={form[f]} onChange={e => setForm({ ...form, [f]: e.target.value })} />
          ))}
          <button onClick={registerStudent} className="bg-green-600 px-3 py-1 rounded">Register</button>
        </div>
      )}

      {userId && !isAdmin && (
        <>
          <div className="bg-white/10 p-4 rounded mb-6">
            <p><strong>User ID:</strong> {userId}</p>
            <p><strong>Balance:</strong> ₹{balance}</p>
            <input type="number" value={amountToAdd} onChange={e => setAmountToAdd(e.target.value)} placeholder="Amount" className="text-black p-1 rounded mr-2 mt-2" />
            <button onClick={addBalance} className="bg-green-600 px-3 py-1 rounded">Add Balance</button>
          </div>

          <h2 className="text-xl font-semibold">Available Courses</h2>
          {courses.map(course => (
            <div key={course.id} className="bg-white/10 p-4 rounded mb-3">
              <h3 className="font-bold">📘 {course.name}</h3>
              <p>{course.description}</p>
              <p>Cost: ₹{course.cost}</p>
              <button onClick={() => enroll(course.id)} className="bg-blue-600 px-3 py-1 mt-2 rounded">Enroll</button>
              <div className="mt-2">
                <button onClick={() => completeTask(1)} className="bg-yellow-600 px-3 py-1 mr-2 rounded">Complete Task 1</button>
                <button onClick={() => completeTask(2)} className="bg-yellow-600 px-3 py-1 rounded">Complete Task 2</button>
              </div>
            </div>
          ))}

          <h2 className="text-xl font-semibold mt-6">Your Progress</h2>
          <ul className="list-disc ml-6">
            {progress.length === 0 ? <li>No tasks completed</li> : progress.map((p, i) => <li key={i}>{p.task}</li>)}
          </ul>
        </>
      )}

      {isAdmin && (
        <div>
          <h2 className="text-xl font-semibold mb-2">Add Course</h2>
          {["name", "description", "cost"].map(f => (
            <input key={f} className="text-black p-1 rounded mr-2 mb-2" placeholder={f} value={newCourse[f]} onChange={e => setNewCourse({ ...newCourse, [f]: e.target.value })} />
          ))}
          <button onClick={addCourse} className="bg-green-600 px-3 py-1 rounded">Add Course</button>

          <h2 className="text-xl font-semibold mt-6">Add Task</h2>
          {["courseId", "task", "cost"].map(f => (
            <input key={f} className="text-black p-1 rounded mr-2 mb-2" placeholder={f} value={newTask[f]} onChange={e => setNewTask({ ...newTask, [f]: e.target.value })} />
          ))}
          <button onClick={addTask} className="bg-green-600 px-3 py-1 rounded">Add Task</button>

          <div className="mt-8">
            <button onClick={fetchStudents} className="bg-sky-600 px-3 py-1 rounded mr-2">View Students</button>
            <button onClick={fetchAdminProgress} className="bg-purple-600 px-3 py-1 rounded">View Progress</button>
          </div>

          {students.length > 0 && <>
            <h3 className="text-lg font-semibold mt-4">Registered Students</h3>
            <ul className="list-disc ml-6">
              {students.map(s => <li key={s.id}>{s.name} - {s.email} ({s.gender})</li>)}
            </ul>
          </>}

          {adminProgress.length > 0 && <>
            <h3 className="text-lg font-semibold mt-4">Student Progress</h3>
            <ul className="list-disc ml-6">
              {adminProgress.map((p, i) => <li key={i}>{p.name} - {p.task}</li>)}
            </ul>
          </>}
        </div>
      )}
    </div>
  );
}
