"use client";

import { useState, useEffect, useCallback, KeyboardEvent } from "react";
import { hc } from "hono/client";
import type { appType } from "@/api/src/index";

interface Todo {
  id: string;
  title: string;
  status: string;
  createdAt: string;
  updatedAt: string;
}

export default function TaskManager() {
  const client = hc<appType>("http://localhost:4000");

  const [userInfo, setUserInfo] = useState<string | null>(null);
  const [task, setTask] = useState("");
  const [newUser, setNewUser] = useState("");
  const [todos, setTodos] = useState<Todo[]>([]);

  const fetchTodos = useCallback(
    async (user: string) => {
      try {
        const response = await client[":user"].todos.$get({ param: { user } });
        if (!response.ok) throw new Error("Failed to fetch todos");
        const data = await response.json();
        setTodos(data);
      } catch (error) {
        console.error("Error fetching todos:", error);
      }
    },
    [client],
  );

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      setUserInfo(storedUser);
      fetchTodos(storedUser);
    }
  }, [fetchTodos]);

  const addUser = () => {
    if (newUser) {
      localStorage.setItem("user", newUser);
      setUserInfo(newUser);
      fetchTodos(newUser);
      setNewUser("");
    }
  };

  const addTask = async () => {
    if (!userInfo || !task) return;
    try {
      const response = await client[":user"].todos.$post({
        param: { user: userInfo },
        json: { title: task },
      });
      if (!response.ok) throw new Error("Failed to add task");
      fetchTodos(userInfo);
      setTask("");
    } catch (error) {
      console.error("Error adding task:", error);
    }
  };

  const updateTaskStatus = async (todoId: string, currentStatus: string) => {
    if (!userInfo) return;
    const newStatus = currentStatus === "todo" ? "pending" : "completed";
    try {
      const response = await client[":user"].todos[":id"].$put({
        param: { user: userInfo, id: todoId },
        json: { status: newStatus },
      });
      if (!response.ok) throw new Error("Failed to update task");
      fetchTodos(userInfo);
    } catch (error) {
      console.error("Error updating task:", error);
    }
  };

  const deleteTask = async (todoId: string) => {
    if (!userInfo) return;
    try {
      const response = await client[":user"].todos[":id"].$delete({
        param: { user: userInfo, id: todoId },
      });
      if (!response.ok) throw new Error("Failed to delete task");
      fetchTodos(userInfo);
    } catch (error) {
      console.error("Error deleting task:", error);
    }
  };

  const logOff = () => {
    localStorage.removeItem("user");
    setUserInfo(null);
    setTodos([]);
  };

  const handleKeyPress = (
    event: KeyboardEvent<HTMLInputElement>,
    action: () => void,
  ) => {
    if (event.key === "Enter") {
      action();
    }
  };

  return (
    <div className="box-border lg:px-[7%] py-[8%] lg:py-[10%] bg-[#f7f9fa]">
      <section className="box-border grid gap-9 px-4 xs:px-8 sm:px-10 md:px-11 lg:px-12 pt-16 pb-16 shadow-xl rounded-md">
        {userInfo && (
          <div id="logOff" className="block">
            <button
              className="transition duration-500 hover:scale-125"
              onClick={logOff}
            >
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M13 4.00894C13.0002 3.45665 12.5527 3.00876 12.0004 3.00854C11.4481 3.00833 11.0002 3.45587 11 4.00815L10.9968 12.0116C10.9966 12.5639 11.4442 13.0118 11.9965 13.012C12.5487 13.0122 12.9966 12.5647 12.9968 12.0124L13 4.00894Z"
                  fill="#e11d48"
                />
                <path
                  d="M4 12.9917C4 10.7826 4.89541 8.7826 6.34308 7.33488L7.7573 8.7491C6.67155 9.83488 6 11.3349 6 12.9917C6 16.3054 8.68629 18.9917 12 18.9917C15.3137 18.9917 18 16.3054 18 12.9917C18 11.3348 17.3284 9.83482 16.2426 8.74903L17.6568 7.33481C19.1046 8.78253 20 10.7825 20 12.9917C20 17.41 16.4183 20.9917 12 20.9917C7.58172 20.9917 4 17.41 4 12.9917Z"
                  fill="#e11d48"
                />
              </svg>
            </button>
          </div>
        )}

        <div className="flex flex-col justify-center items-center gap-10">
          <div className="flex flex-col gap-5 text-center">
            <h1 className="font-bold text-4xl">Task Manager</h1>
            <p className="text-sm sm:text-base text-slate-500">
              Stay organized and productive with our intuitive to-do app
            </p>
          </div>
          {userInfo ? (
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <input
                type="text"
                value={task}
                onChange={(e) => setTask(e.target.value)}
                onKeyPress={(e) => handleKeyPress(e, addTask)}
                className="box-border h-11 w-56 sm:w-72 md:w-80 lg:w-[27rem] border-0 pl-5 py-2 focus:outline-none rounded bg-slate-200"
                placeholder="Add a new task in todo"
              />
              <button
                onClick={addTask}
                className="box-border h-11 w-32 rounded-md text-center text-lg font-semibold text-slate-100 bg-black"
              >
                Add Task
              </button>
            </div>
          ) : (
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <input
                type="text"
                value={newUser}
                onChange={(e) => setNewUser(e.target.value)}
                onKeyPress={(e) => handleKeyPress(e, addUser)}
                className="box-border h-11 w-56 sm:w-72 md:w-80 lg:w-[27rem] border-0 pl-5 py-2 focus:outline-none rounded bg-slate-200"
                placeholder="Enter Username Please"
              />
              <button
                onClick={addUser}
                className="box-border h-11 w-32 rounded-md text-center text-lg font-semibold text-slate-100 bg-black"
              >
                Add User
              </button>
            </div>
          )}
        </div>

        {userInfo && (
          <div className="box-border grid grid-cols-custom-fit gap-10">
            {["todo", "pending", "completed"].map((status) => (
              <div key={status} className="box-border shadow-xl rounded-b-lg">
                <div
                  className={`p-6 font-bold text-lg rounded-t-lg ${
                    status === "todo"
                      ? "bg-[#dbeaff]"
                      : status === "pending"
                      ? "bg-[#f3e8ff]"
                      : "bg-[#dcfce7]"
                  }`}
                >
                  {status === "todo"
                    ? "To Do"
                    : status === "pending"
                    ? "In Progress"
                    : "Completed"}
                </div>
                <div className="flex flex-col pl-6 pr-11 py-8 gap-11 max-h-60 overflow-y-auto">
                  {todos
                    .filter((todo) => todo.status === status)
                    .map((todo) => (
                      <div
                        key={todo.id}
                        className="flex flex-row justify-center items-center"
                      >
                        {status !== "completed" && (
                          <input
                            type="checkbox"
                            checked={status === "completed"}
                            onChange={() => updateTaskStatus(todo.id, status)}
                            className="flex-none w-4 h-4 hover:cursor-pointer"
                          />
                        )}
                        <label className="grow ml-4 font-semibold text-lg">
                          {todo.title}
                        </label>
                        <svg
                          onClick={() => deleteTask(todo.id)}
                          className="flex-none w-5 h-5 hover:cursor-pointer"
                          viewBox="0 0 24 24"
                          fill="none"
                          xmlns="http://www.w3.org/2000/svg"
                        >
                          <path
                            d="M6.2253 4.81108C5.83477 4.42056 5.20161 4.42056 4.81108 4.81108C4.42056 5.20161 4.42056 5.83477 4.81108 6.2253L10.5858 12L4.81114 17.7747C4.42062 18.1652 4.42062 18.7984 4.81114 19.1889C5.20167 19.5794 5.83483 19.5794 6.22535 19.1889L12 13.4142L17.7747 19.1889C18.1652 19.5794 18.7984 19.5794 19.1889 19.1889C19.5794 18.7984 19.5794 18.1652 19.1889 17.7747L13.4142 12L19.189 6.2253C19.5795 5.83477 19.5795 5.20161 19.189 4.81108C18.7985 4.42056 18.1653 4.42056 17.7748 4.81108L12 10.5858L6.2253 4.81108Z"
                            fill="currentColor"
                          />
                        </svg>
                      </div>
                    ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
