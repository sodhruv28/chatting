import React from "react"
import ReactDOM from "react-dom/client"
import App from "./App.jsx"
import { CallProvider } from "./context/CallContext"
import "bootstrap-icons/font/bootstrap-icons.css"
import "./index.css"

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <CallProvider>
      <App />
    </CallProvider>
  </React.StrictMode>
)
